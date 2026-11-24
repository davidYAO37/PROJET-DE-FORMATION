import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IFacturation } from '@/models/Facturation';
import { IConsultation } from '@/models/consultation';
import { IPrescription } from '@/models/Prescription';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { IAssurance } from '@/models/assurance';
import mongoose from 'mongoose';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function PUT(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const Prescription = getTenantModel<IPrescription>(connection, 'Prescription');
  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');

  try {
    const body = await request.json();
    const {
      idConsultation,
      idPrescription,
      idHospitalisation,
      idFacturation,
      assuranceId,
      nomAssurance,
      societePatient,
      idSocieteAssurance,
      matricule,
      numBon,
    } = body;

    const hasData = assuranceId || (nomAssurance !== undefined && nomAssurance !== '') ||
      (societePatient !== undefined && societePatient !== '') ||
      (idSocieteAssurance !== undefined && idSocieteAssurance !== '') ||
      (matricule !== undefined && matricule !== '') ||
      (numBon !== undefined && numBon !== '');
    if (!hasData) {
      return NextResponse.json({ success: false, message: 'Aucune donnée à modifier' }, { status: 400 });
    }

    // StatutFacture exclu : une ligne déjà intégrée à un bordereau ne doit plus
    // être modifiée (le snapshot LigneFacture divergerait du document source)
    const nonFacture = { StatutFacture: { $ne: true } };
    const dejaBordereau = () => NextResponse.json(
      { success: false, message: 'Cette ligne est déjà intégrée à un bordereau et ne peut plus être modifiée' },
      { status: 409 }
    );

    // Changement d'assurance → recalcul des parts avec le taux de la nouvelle
    // assurance (mêmes formules qu'à la facturation)
    let nouvelleAssurance: any = null;
    if (assuranceId) {
      const Assurance = getTenantModel<IAssurance>(connection, 'Assurance');
      nouvelleAssurance = await Assurance.findById(assuranceId).lean();
      if (!nouvelleAssurance) {
        return NextResponse.json({ success: false, message: 'Assurance introuvable' }, { status: 404 });
      }
    }
    const nouveauTaux = nouvelleAssurance ? Number(nouvelleAssurance.Taux) || 0 : null;
    const nomAssuranceEffectif = (nomAssurance !== undefined && nomAssurance !== '')
      ? nomAssurance
      : nouvelleAssurance?.designationassurance;
    const arrondiMod = (n: number) => Math.round(n || 0);

    // Recalcul partagé Facturation / ExamenHospitalisation (mêmes champs) :
    // partAssurance = montantTotal × taux/100 ; partPatient = montantApresRemise − partAssurance
    const recalculFacturation = (doc: any) => {
      if (nouveauTaux === null) return {};
      const montantTotal = Number(doc.Montanttotal) || 0;
      const apresRemise = Math.max(0, montantTotal - (Number(doc.reduction) || 0) - arrondiMod(montantTotal * (Number(doc.tauxreduction) || 0) / 100));
      const partAssurance = arrondiMod(montantTotal * nouveauTaux / 100);
      const partPatient = apresRemise - partAssurance;
      return {
        Taux: String(nouveauTaux),
        PartAssuranceP: partAssurance,
        Partassure: partPatient,
        TotalapayerPatient: partPatient,
        Restapayer: Math.max(0, partPatient - (Number(doc.MontantRecu) || 0)),
      };
    };

    // 1. Consultation
    if (idConsultation) {
      const consData: Record<string, any> = {};
      if (assuranceId) consData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssuranceEffectif) consData.assurance = nomAssuranceEffectif;
      if (societePatient !== undefined && societePatient !== '') consData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') consData.IDSOCIETEASSURANCE = idSocieteAssurance;
      if (matricule !== undefined && matricule !== '') consData.numero_carte = matricule;
      if (numBon !== undefined && numBon !== '') consData.NumBon = numBon;
      const doc = await Consultation.findOne({ _id: idConsultation, ...nonFacture, ...getTenantFilter(context) }).lean();
      if (!doc) return dejaBordereau();
      if (nouveauTaux !== null) {
        const base = Number((doc as any).Prix_Assurance) || Number((doc as any).PrixClinique) || 0;
        const partAssurance = arrondiMod(base * nouveauTaux / 100);
        const partAssure = base - partAssurance;
        const aPayer = partAssure + (Number((doc as any).ReliquatPatient) || 0);
        consData.tauxAssurance = nouveauTaux;
        consData.PartAssurance = partAssurance;
        consData.tiket_moderateur = partAssure;
        consData.montantapayer = aPayer;
        consData.Restapayer = aPayer;
      }
      await Consultation.updateOne({ _id: idConsultation, ...getTenantFilter(context) }, { $set: consData });
    }

    // 2. Facturation (prestation / hospitalisation / pharmacie)
    if (idFacturation) {
      const factData: Record<string, any> = {};
      if (assuranceId) factData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssuranceEffectif) factData.Assurance = nomAssuranceEffectif;
      if (societePatient !== undefined && societePatient !== '') factData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') factData.IDSOCIETEASSURANCE = new mongoose.Types.ObjectId(idSocieteAssurance);
      if (matricule !== undefined && matricule !== '') factData.Numcarte = matricule;
      if (numBon !== undefined && numBon !== '') factData.NumBon = numBon;
      const doc = await Facturation.findOne({ _id: idFacturation, ...nonFacture, ...getTenantFilter(context) }).lean();
      if (!doc) return dejaBordereau();
      Object.assign(factData, recalculFacturation(doc));
      await Facturation.updateOne({ _id: idFacturation, ...getTenantFilter(context) }, { $set: factData });
    }

    // 3. Prescription
    if (idPrescription) {
      const presData: Record<string, any> = {};
      if (assuranceId) presData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssuranceEffectif) presData.Assurance = nomAssuranceEffectif;
      if (societePatient !== undefined && societePatient !== '') presData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') presData.IDSOCIETEASSURANCE = idSocieteAssurance;
      if (matricule !== undefined && matricule !== '') presData.Numcarte = matricule;
      if (numBon !== undefined && numBon !== '') presData.NumBon = numBon;
      const doc = await Prescription.findOne({ _id: idPrescription, ...nonFacture, ...getTenantFilter(context) }).lean();
      if (!doc) return dejaBordereau();
      if (nouveauTaux !== null) {
        const montantTotal = Number((doc as any).Montanttotal) || 0;
        const partAssurance = arrondiMod(montantTotal * nouveauTaux / 100);
        const partPatient = montantTotal - partAssurance;
        presData.Taux = nouveauTaux;
        presData.TotalapayerPatient = partPatient;
        presData.Restapayer = Math.max(0, partPatient - (Number((doc as any).MontantRecu) || 0));
      }
      await Prescription.updateOne({ _id: idPrescription, ...getTenantFilter(context) }, { $set: presData });
    }

    // 4. ExamenHospitalisation
    if (idHospitalisation) {
      const hospData: Record<string, any> = {};
      if (assuranceId) hospData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssuranceEffectif) hospData.Assurance = nomAssuranceEffectif;
      if (societePatient !== undefined && societePatient !== '') hospData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') hospData.IDSOCIETEASSURANCE = new mongoose.Types.ObjectId(idSocieteAssurance);
      if (matricule !== undefined && matricule !== '') hospData.Numcarte = matricule;
      if (numBon !== undefined && numBon !== '') hospData.NumBon = numBon;
      const doc = await ExamenHospitalisation.findOne({ _id: idHospitalisation, ...nonFacture, ...getTenantFilter(context) }).lean();
      if (!doc) return dejaBordereau();
      Object.assign(hospData, recalculFacturation(doc));
      await ExamenHospitalisation.updateOne({ _id: idHospitalisation, ...getTenantFilter(context) }, { $set: hospData });
    }

    return NextResponse.json({ success: true, message: 'Ligne modifiée avec succès' });
  } catch (error) {
    console.error('Erreur modification ligne bordereau assurance:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
