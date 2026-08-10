
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IConsultation } from "@/models/consultation";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "caisse", "comptable"];

export async function GET(request: NextRequest) {
    const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
    if (!context) return tenantErrorResponse;
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");

    const { searchParams } = new URL(request.url);
    const CodePrestation = searchParams.get("CodePrestation");

    // Recherche la consultation par CodePrestation
    const consultation = await Consultation.findOne({ CodePrestation: CodePrestation }).lean();
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
        ...consultation, // Include all fields from consultation
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
        Assure: consultation.Assure,
        // assure: consultation.Assuré,
        Code_dossier: consultation.Code_dossier,
        //Info clinique
        Temperature: consultation.Temperature,
        Tension: consultation.Tension,
        TailleCons: consultation.TailleCons,
        Glycemie: consultation.Glycemie,
        Poids: consultation.Poids,
        info: infoMessage,
    };

    return NextResponse.json(response);
}
