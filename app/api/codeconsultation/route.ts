
import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Consultation } from "@/models/consultation";
import { Patient } from "@/models/patient";
import { ExamenHospitalisation } from "@/models/examenHospit";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const codePrestation = searchParams.get("Code_Prestation");

    await db();

    // Recherche la consultation par Code_Prestation
    const consultation = await Consultation.findOne({ Code_Prestation: codePrestation }).lean();
    if (!consultation) {
        return NextResponse.json({ error: "Code non valide" }, { status: 404 });
    }

    // Vérification du ticket modérateur et du statut
    let infoMessage: string | null = null;
    if (consultation.tiket_moderateur !== 0 && !consultation.StatutC) {
        infoMessage = "ℹ️ La consultation liée à cette prestation n'est pas encore facturée.";
    }



    // Recherche du patient lié à la consultation
    const patient = await Patient.findById(consultation.IDPARTIENT).lean();
    if (!patient) {
        return NextResponse.json({ error: "Ce patient n'est pas connu" }, { status: 404 });
    }

    // Recherche d'un examen hospitalisation lié à ce code prestation
    const examen = await ExamenHospitalisation.findOne({ Code_Prestation: codePrestation }).lean();

    // Préparation de la réponse
    const response: any = {
        patient: {
            _id: patient._id,
            Nom: patient.Nom,
            Prenoms: patient.Prenoms,
        },
        medecinPrescripteur: consultation.IDMEDECIN,
        taux: consultation.tauxAssurance,
        matricule: consultation.numero_carte,
        numeroBon: consultation.NumBon,
        designationC: consultation.designationC,
        idAssurance: consultation.IDASSURANCE,
        societe: consultation.SOCIETE_PATIENT,
        numero: consultation.IDSOCIETEASSUANCE,
        souscripteur: consultation.Souscripteur,
        idApporteur: consultation.IDAPPORTEUR,
        assure: consultation.Assuré,
        Code_dossier: consultation.Code_dossier,
        info: infoMessage,
    };

    if (examen) {
        response.examen = {
            designationTypeActe: examen.Designationtypeacte,
            idHospitalisation: examen._id,
            partApporteur: examen.PartApporteur,
            rclinique: examen.Rclinique,
        };
    }

    return NextResponse.json(response);
}
