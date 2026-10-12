import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { buildVitalAlerts } from "@/lib/medicalSummary";
import { IPatient } from "@/models/patient";
import { IConsultation } from "@/models/consultation";
import { IPrescription } from "@/models/Prescription";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { ILignePrestation } from "@/models/lignePrestation";
import { PatientSummary, PatientSummaryEvent } from "@/types/patientSummary";

const ROLES = ["admin", "medecin", "infirmier"];

const toIsoString = (value: unknown) => {
  const date = value ? new Date(value as string | Date) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
};

const calculateAge = (birthDate?: Date) => {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export async function GET(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  const { context, response } = await withTenant(request, ROLES);
  if (!context) return response;

  const { id } = await routeContext.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Identifiant patient invalide" }, { status: 400 });
  }

  const patientId = new Types.ObjectId(id);
  const Patient = getTenantModel<IPatient>(context.connection, "Patient");
  const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");
  const Prescription = getTenantModel<IPrescription>(context.connection, "Prescription");
  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
  const LignePrestation = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");

  try {
    const patient = await Patient.findById(patientId)
      .select("Nom Prenoms Date_naisse sexe Contact Code_dossier Assurance AntecedentMedico AnteChirurgico AnteFamille AutreAnte AlergiePatient")
      .lean();

    if (!patient) {
      return NextResponse.json({ error: "Patient non trouvé" }, { status: 404 });
    }

    const biologicalQuery = { IdPatient: patientId, Designationtypeacte: "EXAMEN BIOLOGIQUE" };
    const hospitalisationQuery = {
      IdPatient: patientId,
      Designationtypeacte: { $ne: "EXAMEN BIOLOGIQUE" },
      $or: [
        { statutHospitalisation: { $exists: true } },
        { Entrele: { $exists: true } },
        { SortieLe: { $exists: true } },
      ],
    };
    const radiologyQuery = {
      IdPatient: patientId,
      $or: [
        { resultatSaisiePar: { $exists: true, $ne: "" } },
        { compteRenduValideLe: { $exists: true } },
        { medecinExecutant: { $exists: true, $ne: "" } },
      ],
    };

    const [
      latestConsultations,
      consultationCount,
      latestPrescriptions,
      prescriptionCount,
      latestBiologicalExams,
      biologicalExamCount,
      latestRadiologyReports,
      radiologyReportCount,
      latestHospitalisations,
      hospitalisationCount,
    ] = await Promise.all([
      Consultation.find({ IdPatient: patientId })
        .sort({ Date_consulation: -1 })
        .limit(5)
        .select("Date_consulation MotifConsultation Diagnostic ExamenClinique TraitementClinique ConclusionClinique Medecin Temperature Tension Pouls Poids designationC")
        .lean(),
      Consultation.countDocuments({ IdPatient: patientId }),
      Prescription.find({ IdPatient: patientId })
        .sort({ DatePres: -1 })
        .limit(5)
        .select("DatePres Designation NomMed Rclinique StatutPaiement")
        .lean(),
      Prescription.countDocuments({ IdPatient: patientId }),
      ExamenHospitalisation.find(biologicalQuery)
        .sort({ DatePres: -1, dateSaisieResultat: -1 })
        .limit(5)
        .select("DatePres dateSaisieResultat DateValidation Designationtypeacte resultatacte StatutLaboratoire Biologiste")
        .lean(),
      ExamenHospitalisation.countDocuments(biologicalQuery),
      LignePrestation.find(radiologyQuery)
        .sort({ dateLignePrestation: -1 })
        .limit(5)
        .select("dateLignePrestation prestation resultatSaisiePar compteRenduValideLe compteRenduValidePar")
        .lean(),
      LignePrestation.countDocuments(radiologyQuery),
      ExamenHospitalisation.find(hospitalisationQuery)
        .sort({ Entrele: -1, DatePres: -1 })
        .limit(5)
        .select("Entrele DatePres SortieLe motifHospitalisation service statutHospitalisation NomMed")
        .lean(),
      ExamenHospitalisation.countDocuments(hospitalisationQuery),
    ]);

    const latestConsultation = latestConsultations[0];
    const latestVitals = latestConsultations.find((item) => item.Temperature || item.Tension || item.Pouls || item.Poids);
    const alerts = latestVitals
      ? buildVitalAlerts({
          temperature: latestVitals.Temperature,
          tension: latestVitals.Tension,
          pouls: latestVitals.Pouls,
        })
      : [];
    const allergies = patient.AlergiePatient?.trim();
    if (allergies) {
      alerts.unshift({ code: "known-allergy", label: `Allergie : ${allergies}`, level: "critical" });
    }

    const missingInformation: string[] = [];
    if (!allergies) missingInformation.push("Allergies non renseignées");
    if (!patient.AntecedentMedico && !patient.AnteChirurgico && !patient.AnteFamille && !patient.AutreAnte) {
      missingInformation.push("Antécédents non renseignés");
    }
    if (!latestVitals) missingInformation.push("Aucune constante disponible");

    const recentEvents: PatientSummaryEvent[] = [
      ...latestConsultations.map((item) => ({
        id: String(item._id),
        type: "consultation" as const,
        date: toIsoString(item.Date_consulation),
        title: item.MotifConsultation || item.designationC || "Consultation",
        detail: item.Diagnostic || item.ConclusionClinique || undefined,
      })),
      ...latestPrescriptions.map((item) => ({
        id: String(item._id),
        type: "prescription" as const,
        date: toIsoString(item.DatePres),
        title: item.Designation || "Prescription",
        detail: item.Rclinique || item.NomMed || undefined,
        status: item.StatutPaiement || undefined,
      })),
      ...latestBiologicalExams.map((item) => ({
        id: String(item._id),
        type: "biologie" as const,
        date: toIsoString(item.dateSaisieResultat || item.DatePres),
        title: item.Designationtypeacte || "Examen biologique",
        detail: item.resultatacte || undefined,
        status: item.DateValidation ? "Validé" : "En attente",
      })),
      ...latestRadiologyReports.map((item) => ({
        id: String(item._id),
        type: "radiologie" as const,
        date: toIsoString(item.compteRenduValideLe || item.dateLignePrestation),
        title: item.prestation || "Examen radiologique",
        status: item.compteRenduValideLe ? "Validé" : "En attente",
      })),
      ...latestHospitalisations.map((item) => ({
        id: String(item._id),
        type: "hospitalisation" as const,
        date: toIsoString(item.Entrele || item.DatePres),
        title: item.motifHospitalisation || item.service || "Hospitalisation",
        detail: item.NomMed || undefined,
        status: item.statutHospitalisation || undefined,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const summary: PatientSummary = {
      patient: {
        id: String(patient._id),
        fullName: `${patient.Nom || ""} ${patient.Prenoms || ""}`.trim(),
        birthDate: patient.Date_naisse ? toIsoString(patient.Date_naisse) : undefined,
        age: calculateAge(patient.Date_naisse),
        sex: patient.sexe || undefined,
        fileNumber: patient.Code_dossier,
        contact: patient.Contact || undefined,
        insurance: patient.Assurance || undefined,
      },
      vigilance: {
        allergiesStatus: allergies ? "known" : "unknown",
        allergies: allergies || undefined,
        alerts,
        missingInformation,
      },
      history: {
        medical: patient.AntecedentMedico || undefined,
        surgical: patient.AnteChirurgico || undefined,
        family: patient.AnteFamille || undefined,
        other: patient.AutreAnte || undefined,
      },
      latestVitals: latestVitals
        ? {
            date: toIsoString(latestVitals.Date_consulation),
            temperature: latestVitals.Temperature || undefined,
            bloodPressure: latestVitals.Tension || undefined,
            pulse: latestVitals.Pouls || undefined,
            weight: latestVitals.Poids || undefined,
          }
        : undefined,
      latestConsultation: latestConsultation
        ? {
            id: String(latestConsultation._id),
            date: toIsoString(latestConsultation.Date_consulation),
            doctor: latestConsultation.Medecin || undefined,
            reason: latestConsultation.MotifConsultation || latestConsultation.designationC || undefined,
            diagnosis: latestConsultation.Diagnostic || undefined,
            examination: latestConsultation.ExamenClinique || undefined,
            treatment: latestConsultation.TraitementClinique || undefined,
            conclusion: latestConsultation.ConclusionClinique || undefined,
          }
        : undefined,
      recentEvents,
      counts: {
        consultations: consultationCount,
        prescriptions: prescriptionCount,
        biologicalExams: biologicalExamCount,
        radiologyReports: radiologyReportCount,
        hospitalisations: hospitalisationCount,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Erreur GET /api/patients/[id]/summary:", error);
    return NextResponse.json({ error: "Impossible de générer la synthèse du patient" }, { status: 500 });
  }
}
