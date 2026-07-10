import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { caisse } from '@/models/caisse';
import { Consultation } from '@/models/consultation';
import { Facturation } from '@/models/Facturation';
import { EncaissementCaisse } from '@/models/EncaissementCaisse';

const MODES_EXCLUS = ['chèque', 'carte de crédit'];

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    if (!dateDebut || !dateFin) {
      return NextResponse.json({ success: false, message: 'dateDebut et dateFin sont requis' }, { status: 400 });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    fin.setHours(23, 59, 59, 999);

    const lignes: any[] = [];

    // ── 1. CAISSE : Entrées → RECETTE, Sorties → DEPENSE ──────────────────────
    const docsCaisse = await caisse.find({
      dAteC: { $gte: debut, $lte: fin },
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
    }).lean();

    for (const c of consultations) {
      const mode = (c.Modepaiement || '').toLowerCase();
      if (MODES_EXCLUS.some(m => mode.includes(m))) continue;
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
    }).lean();

    for (const f of facturations) {
      const mode = (f.Modepaiement || '').toLowerCase();
      if (MODES_EXCLUS.some(m => mode.includes(m))) continue;
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
    }).lean();

    for (const e of encaissements) {
      const mode = (e.Modepaiement || '').toLowerCase();
      if (MODES_EXCLUS.some(m => mode.includes(m))) continue;
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

    // ── Tri par date croissante ────────────────────────────────────────────────
    lignes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalRecette = lignes.reduce((s, l) => s + l.recette, 0);
    const totalDepense = lignes.reduce((s, l) => s + l.depense, 0);
    const solde = totalRecette - totalDepense;

    return NextResponse.json({
      success: true,
      data: lignes,
      totaux: { totalRecette, totalDepense, solde },
      count: lignes.length,
    });
  } catch (error) {
    console.error('Erreur recette/dépense:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
