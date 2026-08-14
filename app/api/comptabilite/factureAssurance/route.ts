import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IFactureAssur } from '@/models/factureAssur';
import { IPaiementPartenaire } from '@/models/paiementPartenaire';
import { IFacturation } from '@/models/Facturation';
import { IConsultation } from '@/models/consultation';
import { IPrescription } from '@/models/Prescription';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ILigneFacture } from '@/models/ligneFacture';

const ROLES = ['admin', 'adminsuper', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const FacturationAssur = getTenantModel<IFactureAssur>(connection, 'FactureAssur');
  const PaiementPartenaire = getTenantModel<IPaiementPartenaire>(connection, 'PaiementPartenaire');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'liste';
    const entrepriseId = searchParams.get('entrepriseId') || '';
    const assurance = searchParams.get('assurance') || '';
    const dateDebut = searchParams.get('dateDebut') || '';
    const dateFin = searchParams.get('dateFin') || '';
    const etat = searchParams.get('etat') || ''; // 'payee' | 'nonpayee' | ''

    const filtreEntreprise = entrepriseId ? { entrepriseId } : {};

    if (action === 'assurances') {
      // Liste des assurances distinctes depuis les facturations
      const assurances = await Facturation.distinct('Assurance', {
        Assurance: { $nin: [null, ''] },
        ...filtreEntreprise,
      });
      return NextResponse.json({ success: true, data: assurances.filter(Boolean) });
    }

    const filtre: any = { ...filtreEntreprise };

    if (assurance) filtre.Assurance = assurance;

    if (dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      filtre.Date = { $gte: debut, $lte: fin };
    }

    if (etat === 'payee') filtre.etat_facture = true;
    else if (etat === 'nonpayee') filtre.etat_facture = { $ne: true };

    const factures = await FacturationAssur.find(filtre).sort({ Date: -1 }).lean();

    const factureIds = factures.map(f => f._id);
    const paiements = await PaiementPartenaire.find({ FactureAssur: { $in: factureIds } }).lean();

    const paiementsParFacture = new Map<string, any[]>();
    for (const p of paiements) {
      const cle = String(p.FactureAssur);
      if (!paiementsParFacture.has(cle)) paiementsParFacture.set(cle, []);
      paiementsParFacture.get(cle)!.push(p);
    }

    const data = factures.map(f => {
      const id = String(f._id);
      const paiementsF = paiementsParFacture.get(id) || [];
      const totalPaye = paiementsF.reduce((s, p) => s + (p.MontantRecu || 0), 0);
      return {
        ...f,
        paiements: paiementsF,
        totalPaye,
        resteAPayer: Math.max(0, (f.PartAssurance || 0) - totalPaye),
      };
    });

    const totaux = {
      totalFacture: data.reduce((s, f) => s + (f.MontantTotalFacture || 0), 0),
      totalPartAssurance: data.reduce((s, f) => s + (f.PartAssurance || 0), 0),
      totalPartAssure: data.reduce((s, f) => s + (f.Partassure || 0), 0),
      totalPaye: data.reduce((s, f) => s + (f.totalPaye || 0), 0),
      totalReste: data.reduce((s, f) => s + (f.resteAPayer || 0), 0),
    };

    return NextResponse.json({ success: true, data, totaux, count: data.length });
  } catch (error) {
    console.error('Erreur factureAssurance GET:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const FacturationAssur = getTenantModel<IFactureAssur>(connection, 'FactureAssur');
  const PaiementPartenaire = getTenantModel<IPaiementPartenaire>(connection, 'PaiementPartenaire');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'creer') {
      const { reference, assurance, typeActe, debutF, finF, saisirpar, entrepriseId } = body;
      if (!assurance) {
        return NextResponse.json({ success: false, message: 'Assurance requise' }, { status: 400 });
      }

      // Récupérer les facturations de la plage correspondant à cette assurance
      const debut = debutF ? new Date(debutF) : new Date();
      const fin = finF ? new Date(finF) : new Date();
      fin.setHours(23, 59, 59, 999);

      const filtreFact: any = {
        Assurance: assurance,
        DateFacturation: { $gte: debut, $lte: fin },
      };
      if (typeActe) filtreFact.Designationtypeacte = typeActe;
      if (entrepriseId) filtreFact.entrepriseId = entrepriseId;

      const facturations = await Facturation.find(filtreFact).lean();
      const montantTotal = facturations.reduce((s, f) => s + (f.Montanttotal || 0), 0);
      const partAssurance = facturations.reduce((s, f) => s + (f.PartAssuranceP || 0), 0);
      const partAssure = facturations.reduce((s, f) => s + (f.Partassure || 0), 0);

      const nouvelleFacture = new FacturationAssur({
        Reference: reference || `FA-${Date.now()}`,
        Assurance: assurance,
        TYPEACTE: typeActe || '',
        Date: new Date(),
        DebutF: debut,
        FinF: fin,
        MontantTotalFacture: montantTotal,
        PartAssurance: partAssurance,
        Partassure: partAssure,
        etat_facture: false,
        Saisirpar: saisirpar || '',
        entrepriseId: entrepriseId || '',
      });

      await nouvelleFacture.save();
      return NextResponse.json({ success: true, message: 'Facture assurance créée', data: nouvelleFacture });
    }

    if (action === 'payer') {
      const { factureAssurId, montant, modePaiement, banque, numeroCheque, recuPar, datePaiement, entrepriseId } = body;
      if (!factureAssurId || !montant) {
        return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
      }

      const facture = await FacturationAssur.findById(factureAssurId);
      if (!facture) {
        return NextResponse.json({ success: false, message: 'Facture introuvable' }, { status: 404 });
      }

      const paiement = new PaiementPartenaire({
        Assurance: facture.Assurance,
        DatePaiement: datePaiement ? new Date(datePaiement) : new Date(),
        Recupar: recuPar || '',
        MontantRecu: montant,
        SaisiLe: new Date(),
        SaisiPar: recuPar || '',
        Heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        FactureAssur: factureAssurId,
        NumChèque: numeroCheque || '',
        BanqueC: banque || '',
        entrepriseId: entrepriseId || facture.entrepriseId || '',
      });

      await paiement.save();

      // Vérifier si la facture est soldée
      const tousLesPaiements = await PaiementPartenaire.find({ FactureAssur: factureAssurId }).lean();
      const totalPaye = tousLesPaiements.reduce((s, p) => s + (p.MontantRecu || 0), 0);
      const estSolde = totalPaye >= (facture.PartAssurance || 0);

      await FacturationAssur.findByIdAndUpdate(factureAssurId, {
        TotalPaye: totalPaye,
        Restapayer: Math.max(0, (facture.PartAssurance || 0) - totalPaye),
        etat_facture: estSolde,
      });

      return NextResponse.json({ success: true, message: 'Paiement enregistré', data: paiement });
    }

    if (action === 'depot') {
      const { factureAssurId, depotPar } = body;
      await FacturationAssur.findByIdAndUpdate(factureAssurId, {
        DateDepot: new Date(),
        DepotPar: depotPar || '',
      });
      return NextResponse.json({ success: true, message: 'Dépôt enregistré' });
    }

    if (action === 'retrait') {
      const { factureAssurId, retirePar } = body;
      await FacturationAssur.findByIdAndUpdate(factureAssurId, {
        DateRetrait: new Date(),
        RetirePar: retirePar || '',
      });
      return NextResponse.json({ success: true, message: 'Retrait enregistré' });
    }

    if (action === 'annuler') {
      const { factureAssurId, annulePar } = body;
      if (!factureAssurId) {
        return NextResponse.json({ success: false, message: 'ID facture requis' }, { status: 400 });
      }

      const facture = await FacturationAssur.findById(factureAssurId);
      if (!facture) {
        return NextResponse.json({ success: false, message: 'Bordereau introuvable' }, { status: 404 });
      }

      // Vérifier qu'aucun paiement n'a été effectué
      const paiements = await PaiementPartenaire.find({ FactureAssur: factureAssurId }).lean();
      const totalPaye = paiements.reduce((s: number, p: any) => s + (p.MontantRecu || 0), 0);
      if (totalPaye > 0) {
        return NextResponse.json({ success: false, message: 'Impossible d\'annuler : des paiements ont déjà été enregistrés' }, { status: 400 });
      }

      const reference = facture.Reference || '';

      // Récupérer les lignes pour retrouver les IDs des documents sources
      const LigneFacture = getTenantModel<ILigneFacture>(connection, 'LigneFacture');
      const lignes = await LigneFacture.find({ FactureAssur: factureAssurId }).lean();

      // Collecter les IDs des documents sources
      const consultationsIds = lignes.filter(l => l.IDCONSULTATION).map(l => l.IDCONSULTATION!);
      const prescriptionsIds = lignes.filter(l => l.IDPRESCRIPTION).map(l => l.IDPRESCRIPTION!);
      const facturationsIds = lignes.filter(l => l.IDFACTURATION).map(l => l.IDFACTURATION!);
      const hospitalisationsIds = lignes.filter(l => l.idHospitalisation).map(l => l.idHospitalisation!);

      // Réinitialiser StatutFacture et Numfacture sur les documents sources
      const resetFields = { $set: { StatutFacture: false, Numfacture: '' } };

      if (consultationsIds.length > 0) {
        const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
        await Consultation.updateMany({ _id: { $in: consultationsIds } }, resetFields);
      }

      if (prescriptionsIds.length > 0) {
        const Prescription = getTenantModel<IPrescription>(connection, 'Prescription');
        await Prescription.updateMany({ _id: { $in: prescriptionsIds } }, resetFields);
      }

      if (facturationsIds.length > 0) {
        await Facturation.updateMany({ _id: { $in: facturationsIds } }, resetFields);
      }

      if (hospitalisationsIds.length > 0) {
        const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
        await ExamenHospitalisation.updateMany({ _id: { $in: hospitalisationsIds } }, resetFields);
      }

      // Aussi réinitialiser par référence (au cas où des lignes n'ont pas d'ID direct)
      if (reference) {
        try {
          const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
          await Consultation.updateMany({ Numfacture: reference }, resetFields);
        } catch { /* */ }
        try {
          const Prescription = getTenantModel<IPrescription>(connection, 'Prescription');
          await Prescription.updateMany({ Numfacture: reference }, resetFields);
        } catch { /* */ }
        try {
          await Facturation.updateMany({ Numfacture: reference }, resetFields);
        } catch { /* */ }
        try {
          const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
          await ExamenHospitalisation.updateMany({ Numfacture: reference }, resetFields);
        } catch { /* */ }
      }

      // Supprimer les lignes du bordereau
      await LigneFacture.deleteMany({ FactureAssur: factureAssurId });

      // Supprimer les récaps
      try {
        const FactureRecap = getTenantModel(connection, 'FactureRecap');
        await FactureRecap.deleteMany({ FactureAssur: factureAssurId });
      } catch { /* */ }

      // Supprimer le bordereau lui-même
      await FacturationAssur.findByIdAndDelete(factureAssurId);

      return NextResponse.json({ success: true, message: 'Bordereau annulé avec succès' });
    }

    return NextResponse.json({ success: false, message: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur factureAssurance POST:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
