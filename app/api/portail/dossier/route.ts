import { NextRequest, NextResponse } from "next/server";
import { requirePatientAuth } from "@/lib/patientAuth";
import { getTenantModel } from "@/lib/tenantModels";
import { IConsultation } from "@/models/consultation";
import "@/models";

// Dossier patient : informations personnelles + historique des consultations.
// Ne retourne que des champs sûrs (pas de données financières internes).
export async function GET(req: NextRequest) {
  const { context, response } = await requirePatientAuth(req);
  if (!context) return response;

  try {
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");

    const p = context.patient;
    const consultations = await Consultation.find({
      IdPatient: context.patientId,
      StatutC: true,
    })
      .select(
        "Date_consulation Heure_Consultation Medecin designationC MotifConsultation Diagnostic ExamenClinique ExamenParaclinique TraitementClinique ConclusionClinique Temperature Poids Tension Pouls TailleCons"
      )
      .sort({ Date_consulation: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(
      {
        dossier: {
          nom: p.Nom,
          prenoms: p.Prenoms,
          codeDossier: p.Code_dossier,
          sexe: p.sexe,
          dateNaissance: p.Date_naisse,
          age: p.Age_partient,
          contact: p.Contact,
          situationgeo: p.Situationgeo,
          antecedentMedico: p.AntecedentMedico || "",
          anteChirurgico: p.AnteChirurgico || "",
          anteFamille: p.AnteFamille || "",
          autreAnte: p.AutreAnte || "",
          allergies: p.AlergiePatient || "",
          assurance: p.Assurance || "",
        },
        consultations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dossier portail:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
