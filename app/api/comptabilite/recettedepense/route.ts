import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ICaisse } from '@/models/caisse';
import { IConsultation } from '@/models/consultation';
import { IFacturation } from '@/models/Facturation';
import { IEncaissementCaisse } from '@/models/EncaissementCaisse';
import { IHonorairePaye } from '@/models/HonorairePaye';
import { IPaiementApporteur } from '@/models/PaiementApporteur';
import { Entreprise, IEntreprise } from '@/models/entreprise';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

const MODES_EXCLUS = ['chèque', 'carte de crédit'];

async function apporteurActif(entrepriseId?: string) {
  if (!entrepriseId) return true;
  const entreprise = await Entreprise.findById(entrepriseId).lean<IEntreprise | null>();
  return !!entreprise?.travailleAvecApporteur;
}

const modeExclu = (mode?: string | null) => {
  if (!mode) return false;
  const normalise = mode.toLowerCase().trim();
  return MODES_EXCLUS.some(m => normalise.includes(m));
};

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const caisse = getTenantModel<ICaisse>(connection, 'Caisse');
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');
  const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(connection, 'EncaissementCaisse');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');
  const PaiementApporteur = getTenantModel<IPaiementApporteur>(connection, 'PaiementApporteur');
  getTenantModel(connection, 'Medecin');
  getTenantModel(connection, 'Apporteur');

  try {
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '1000', 10));
    if (!dateDebut || !dateFin) {
      return NextResponse.json({ success: false, message: 'dateDebut et dateFin sont requis' }, { status: 400 });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    fin.setHours(23, 59, 59, 999);

    const lignes: any[] = [];
    const tenantFilter = getTenantFilter(context);

    // TODO: ce cahier additionne plusieurs sources (Caisse, Consultation, Facturation, EncaissementCaisse)
    // qui peuvent se recouvrir. Pour des totaux fiables, il faudrait choisir une base unique
    // (mouvements de caisse réels OU facturations encaissées) et éviter le double comptage.

    // ── 1. CAISSE : Entrées → RECETTE, Sorties → DEPENSE ──────────────────────
    const docsCaisse = await caisse.find({
      dAteC: { $gte: debut, $lte: fin },
      ...tenantFilter,
    }).lean();

    for (const c of docsCaisse) {
      const isEntree = (c.typeC || '').toLowerCase().includes('entrée');
      lignes.push({
        date: c.dAteC,
        libelle: c.Operation || '',
        motif: c.MOtif || '',
        nomPrenoms: c.NomPrenoms || '',
        recette: isEntree ? (c.MOntantC || 0) : 0,
        depense: isEntree ? 0 : (c.MOntantC || 0),
        source: isEntree ? 'CAISSE ENTRÉE' : 'CAISSE SORTIE',
      });
    }

    // ── 2. CONSULTATION : StatutC=true, mode ≠ Chèque/Carte, PrixClinique ≠ 0 ─
    const consultations = await Consultation.find({
      Date_consulation: { $gte: debut, $lte: fin },
      StatutC: true,
      PrixClinique: { $ne: 0 },
      ...tenantFilter,
    }).lean();

    for (const c of consultations) {
      if (modeExclu(c.Modepaiement)) continue;
      lignes.push({
        date: c.Date_consulation,
        libelle: c.designationC || 'CONSULTATION',
        motif: 'CONSULTATION',
        nomPrenoms: c.PatientP || '',
        recette: c.Montantencaisse || 0,
        depense: 0,
        source: 'CONSULTATION',
      });
    }

    // ── 3. FACTURATION : mode ≠ Chèque/Carte, DateFacturation dans période ─────
    const facturations = await Facturation.find({
      DateFacturation: { $gte: debut, $lte: fin },
      ...tenantFilter,
    }).lean();

    for (const f of facturations) {
      if (modeExclu(f.Modepaiement)) continue;
      lignes.push({
        date: f.DateFacturation,
        libelle: f.Designationtypeacte || '',
        motif: 'PRESTATION',
        nomPrenoms: f.PatientP || '',
        recette: f.MontantRecu || 0,
        depense: 0,
        source: 'FACTURATION',
      });
    }

    // ── 4. ENCAISSEMENT_CAISSE : mode ≠ Chèque/Carte, DateEncaissement dans période ─
    const encaissements = await EncaissementCaisse.find({
      DateEncaissement: { $gte: debut, $lte: fin },
      ...tenantFilter,
    }).lean();

    for (const e of encaissements) {
      if (modeExclu(e.Modepaiement)) continue;
      lignes.push({
        date: e.DateEncaissement,
        libelle: e.Designation || '',
        motif: 'ENCAISSEMENT',
        nomPrenoms: e.Patient || '',
        recette: e.Montantencaisse || 0,
        depense: 0,
        source: 'ENCAISSEMENT',
      });
    }

    // ── 5. HONORAIRES MÉDECINS : paiements des bordereaux médecins ─────────────
    const paiementsMedecins = await HonorairePaye.find({
      Date: { $gte: debut, $lte: fin },
      ...tenantFilter,
    }).populate('Medecin', 'nom prenoms').lean();

    for (const p of paiementsMedecins) {
      if (modeExclu(p.Modepaiement)) continue;
      const medecin = p.Medecin && typeof p.Medecin === 'object'
        ? `${(p.Medecin as any).nom || ''} ${(p.Medecin as any).prenoms || ''}`.trim()
        : '';
      lignes.push({
        date: p.Date,
        libelle: 'HONORAIRE MEDECIN',
        motif: 'Paiement honoraire médecin',
        nomPrenoms: medecin,
        recette: 0,
        depense: p.MontantPayé || 0,
        source: 'HONORAIRE MEDECIN',
      });
    }

    // ── 6. HONORAIRES APPORTEURS : paiements des bordereaux apporteurs ─────────
    const paiementsApporteurs = await PaiementApporteur.find({
      date: { $gte: debut, $lte: fin },
      ...tenantFilter,
    }).populate('Apporteur', 'nom').lean();

    const afficherApporteurs = await apporteurActif(context.entrepriseId);
    if (afficherApporteurs) {
      for (const p of paiementsApporteurs) {
        if (modeExclu(p.modePaiement)) continue;
        const apporteur = p.Apporteur && typeof p.Apporteur === 'object'
          ? (p.Apporteur as any).nom || ''
          : '';
        lignes.push({
          date: p.date,
          libelle: 'HONORAIRE APPORTEURS',
          motif: 'Paiement honoraire apporteur',
          nomPrenoms: apporteur,
          recette: 0,
          depense: p.montant || 0,
          source: 'HONORAIRE APPORTEURS',
        });
      }
    }

    // ── Tri par date croissante ────────────────────────────────────────────────
    lignes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalRecette = lignes.reduce((s, l) => s + l.recette, 0);
    const totalDepense = lignes.reduce((s, l) => s + l.depense, 0);
    const solde = totalRecette - totalDepense;

    const total = lignes.length;
    const start = (page - 1) * limit;
    const paginatedLignes = lignes.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginatedLignes,
      totaux: { totalRecette, totalDepense, solde },
      count: paginatedLignes.length,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Erreur recette/dépense:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
