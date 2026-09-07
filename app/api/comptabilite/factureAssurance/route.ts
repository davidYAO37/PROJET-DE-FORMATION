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

  const session = await connection.startSession();

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'payer') {
      const { factureAssurId, montant, modePaiement, banque, numeroCheque, recuPar, datePaiement, entrepriseId } = body;
      if (!factureAssurId || !montant) {
        return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
      }

      let paiementResult: any;

      await session.withTransaction(async () => {
        const facture = await FacturationAssur.findById(factureAssurId).session(session);
        if (!facture) {
          throw new Error('Facture introuvable');
        }

        const [paiement] = await PaiementPartenaire.create(
          [
            {
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
            },
          ],
          { session }
        );

        const tousLesPaiements = await PaiementPartenaire.find({ FactureAssur: factureAssurId })
          .session(session)
          .lean();
        const totalPaye = tousLesPaiements.reduce((s, p) => s + (p.MontantRecu || 0), 0);
        const estSolde = totalPaye >= (facture.PartAssurance || 0);

        await FacturationAssur.findByIdAndUpdate(
          factureAssurId,
          {
            TotalPaye: totalPaye,
            Restapayer: Math.max(0, (facture.PartAssurance || 0) - totalPaye),
            etat_facture: estSolde,
          },
          { session }
        );

        paiementResult = paiement;
      });

      return NextResponse.json({ success: true, message: 'Paiement enregistré', data: paiementResult });
    }

    if (action === 'depot') {
      const { factureAssurId, depotPar } = body;
      if (!factureAssurId) {
        return NextResponse.json({ success: false, message: 'ID facture requis' }, { status: 400 });
      }
      await session.withTransaction(async () => {
        const facture = await FacturationAssur.findById(factureAssurId).session(session);
        if (!facture) throw new Error('Facture introuvable');
        await FacturationAssur.findByIdAndUpdate(
          factureAssurId,
          {
            DateDepot: new Date(),
            DepotPar: depotPar || '',
          },
          { session }
        );
      });
      return NextResponse.json({ success: true, message: 'Dépôt enregistré' });
    }

    if (action === 'retrait') {
      const { factureAssurId, retirePar } = body;
      if (!factureAssurId) {
        return NextResponse.json({ success: false, message: 'ID facture requis' }, { status: 400 });
      }
      await session.withTransaction(async () => {
        const facture = await FacturationAssur.findById(factureAssurId).session(session);
        if (!facture) throw new Error('Facture introuvable');
        await FacturationAssur.findByIdAndUpdate(
          factureAssurId,
          {
            DateRetrait: new Date(),
            RetirePar: retirePar || '',
          },
          { session }
        );
      });
      return NextResponse.json({ success: true, message: 'Retrait enregistré' });
    }

    if (action === 'annuler') {
      const { factureAssurId, annulePar } = body;
      if (!factureAssurId) {
        return NextResponse.json({ success: false, message: 'ID facture requis' }, { status: 400 });
      }

      await session.withTransaction(async () => {
        const facture = await FacturationAssur.findById(factureAssurId).session(session);
        if (!facture) {
          throw new Error('Bordereau introuvable');
        }

        const paiements = await PaiementPartenaire.find({ FactureAssur: factureAssurId })
          .session(session)
          .lean();
        const totalPaye = paiements.reduce((s: number, p: any) => s + (p.MontantRecu || 0), 0);
        if (totalPaye > 0) {
          throw new Error('Impossible d\'annuler : des paiements ont déjà été enregistrés');
        }

        const reference = facture.Reference || '';
        const LigneFacture = getTenantModel<ILigneFacture>(connection, 'LigneFacture');
        const lignes = await LigneFacture.find({ FactureAssur: factureAssurId })
          .session(session)
          .lean();

        const consultationsIds = lignes.filter(l => l.IDCONSULTATION).map(l => l.IDCONSULTATION!);
        const prescriptionsIds = lignes.filter(l => l.IDPRESCRIPTION).map(l => l.IDPRESCRIPTION!);
        const facturationsIds = lignes.filter(l => l.IDFACTURATION).map(l => l.IDFACTURATION!);
        const hospitalisationsIds = lignes.filter(l => l.idHospitalisation).map(l => l.idHospitalisation!);

        const resetFields = { $set: { StatutFacture: false, Numfacture: '' } };

        if (consultationsIds.length > 0) {
          const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
          await Consultation.updateMany({ _id: { $in: consultationsIds } }, resetFields, { session });
        }

        if (prescriptionsIds.length > 0) {
          const Prescription = getTenantModel<IPrescription>(connection, 'Prescription');
          await Prescription.updateMany({ _id: { $in: prescriptionsIds } }, resetFields, { session });
        }

        if (facturationsIds.length > 0) {
          await Facturation.updateMany({ _id: { $in: facturationsIds } }, resetFields, { session });
        }

        if (hospitalisationsIds.length > 0) {
          const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
          await ExamenHospitalisation.updateMany({ _id: { $in: hospitalisationsIds } }, resetFields, { session });
        }

        if (reference) {
          const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
          await Consultation.updateMany({ Numfacture: reference }, resetFields, { session });
          const Prescription = getTenantModel<IPrescription>(connection, 'Prescription');
          await Prescription.updateMany({ Numfacture: reference }, resetFields, { session });
          await Facturation.updateMany({ Numfacture: reference }, resetFields, { session });
          const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
          await ExamenHospitalisation.updateMany({ Numfacture: reference }, resetFields, { session });
        }

        await LigneFacture.deleteMany({ FactureAssur: factureAssurId }, { session });

        const FactureRecap = getTenantModel(connection, 'FactureRecap');
        await FactureRecap.deleteMany({ FactureAssur: factureAssurId }, { session });

        await FacturationAssur.findByIdAndDelete(factureAssurId, { session });
      });

      return NextResponse.json({ success: true, message: 'Bordereau annulé avec succès' });
    }

    return NextResponse.json({ success: false, message: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur factureAssurance POST:', error);
    const msg = error instanceof Error ? error.message : 'Erreur';
    const status = msg.includes('introuvable') ? 404 : msg.includes('annuler') || msg.includes('déjà été enregistrés') ? 400 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  } finally {
    await session.endSession();
  }
}
