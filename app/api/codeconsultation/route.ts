
import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Consultation } from "@/models/consultation";

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

    if (consultation.tiket_moderateur && consultation.tiket_moderateur !== 0) {
        if (!consultation.StatutC) {
            infoMessage = "⚠️ ATTENTION: La consultation liée à cette prestation doit être facturée";
        }
    }

    // Préparation de la réponse avec les infos patient de la consultation
    const response: any = {
        patient: consultation.PatientP,
        patientId: consultation.IdPatient,
        medecinPrescripteur: consultation.IDMEDECIN,
        taux: consultation.tauxAssurance,
        tauxAssurance: consultation.tauxAssurance,
        matricule: consultation.numero_carte,
        numeroBon: consultation.NumBon,
        NumBon: consultation.NumBon,
        //designationC: consultation.Diagnostic || consultation.designationC || "",
        idAssurance: consultation.IDASSURANCE,
        SOCIETE_PATIENT: consultation.SOCIETE_PATIENT,
        societe: consultation.SOCIETE_PATIENT,
        numero: consultation.IDSOCIETEASSURANCE,
        Souscripteur: consultation.Souscripteur,
        souscripteur: consultation.Souscripteur,
        idApporteur: consultation.IDAPPORTEUR,
        Assuré: consultation.Assuré,
        assure: consultation.Assuré,
        Code_dossier: consultation.Code_dossier,
        info: infoMessage,
    };

    return NextResponse.json(response);
}
