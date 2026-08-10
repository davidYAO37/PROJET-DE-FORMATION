import { NextRequest, NextResponse } from 'next/server';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ILignePrestation } from '@/models/lignePrestation';
import { IPatientPrescription } from '@/models/PatientPrescription';
import { IConsultation } from '@/models/consultation';
import {
  IPrescriptionHospitalisation,
} from '@/models/hospitalisation/PrescriptionHospitalisation';
import { ISoinHospitalisation } from '@/models/hospitalisation/SoinHospitalisation';
import { IConstanteHospitalisation } from '@/models/hospitalisation/ConstanteHospitalisation';
import {
  IEvolutionMedicaleHospitalisation,
} from '@/models/hospitalisation/EvolutionMedicaleHospitalisation';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier"];

export async function GET(request: NextRequest) {
  try {
    const { context, response } = await withTenant(request, READ_ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
    const LignePrestation = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");
    const PatientPrescription = getTenantModel<IPatientPrescription>(context.connection, "PatientPrescription");
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");
    const PrescriptionHospitalisation = getTenantModel<IPrescriptionHospitalisation>(context.connection, "PrescriptionHospitalisation");
    const SoinHospitalisation = getTenantModel<ISoinHospitalisation>(context.connection, "SoinHospitalisation");
    const ConstanteHospitalisation = getTenantModel<IConstanteHospitalisation>(context.connection, "ConstanteHospitalisation");
    const EvolutionMedicaleHospitalisation = getTenantModel<IEvolutionMedicaleHospitalisation>(context.connection, "EvolutionMedicaleHospitalisation");

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const hospitalisationId = searchParams.get('hospitalisationId');

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'patientId requis' },
        { status: 400 }
      );
    }

    // L'admission est enregistrée comme un ExamenHospitalisation dont l'_id sert
    // d'identifiant de référence ("hospitalisationId") pour toutes les sous-collections
    // (prescriptions, soins, constantes, évolutions...). Ce document ne référence donc
    // jamais son propre _id via un champ hospitalisationId : on le retrouve soit
    // directement par son _id, soit via le marqueur statutHospitalisation (uniquement
    // présent sur les enregistrements d'admission).
    const examenFilter: Record<string, unknown> = hospitalisationId
      ? { _id: hospitalisationId }
      : { IdPatient: patientId, statutHospitalisation: { $exists: true } };

    const examenHospit = await ExamenHospitalisation.findOne(examenFilter)
      .sort({ Entrele: -1 })
      .lean();

    if (!examenHospit) {
      return NextResponse.json(
        { success: false, error: 'Aucune hospitalisation trouvée pour ce patient' },
        { status: 404 }
      );
    }

    const [lignesPrestation, prescriptions, soins, constantes, evolutions] = await Promise.all([
      LignePrestation.find({ idHospitalisation: examenHospit._id }).sort({ dateLignePrestation: 1 }).lean(),
      PrescriptionHospitalisation.find({ hospitalisationId: examenHospit._id }).sort({ dateDebut: 1 }).lean(),
      SoinHospitalisation.find({ hospitalisationId: examenHospit._id }).sort({ date: 1 }).lean(),
      ConstanteHospitalisation.find({ hospitalisationId: examenHospit._id }).sort({ date: 1 }).lean(),
      EvolutionMedicaleHospitalisation.find({ hospitalisationId: examenHospit._id }).sort({ date: 1 }).lean(),
    ]);

    // Données de la consultation d'origine liée au code prestation de l'admission,
    // exactement comme PrintFichePrescription : ExamenClinique (texte saisi par le
    // médecin), examens paracliniques (LignePrestation filtrées par lettreCle) et
    // traitement (PatientPrescription).
    let consultation: Record<string, unknown> | null = null;
    let lignesConsultation: Array<Record<string, unknown>> = [];
    let prescriptionsConsultation: Array<Record<string, unknown>> = [];

    if (examenHospit.CodePrestation) {
      [consultation, lignesConsultation, prescriptionsConsultation] = await Promise.all([
        Consultation.findOne({ CodePrestation: examenHospit.CodePrestation }).lean(),
        LignePrestation.find({ CodePrestation: examenHospit.CodePrestation }).lean(),
        PatientPrescription.find({ CodePrestation: examenHospit.CodePrestation }).lean(),
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        examenHospitalisation: examenHospit,
        lignesPrestation,
        prescriptions,
        soins,
        constantes,
        evolutions,
        consultation,
        lignesConsultation,
        prescriptionsConsultation,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données d\'hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
