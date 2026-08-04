import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";
import { IResultatLignePrestation } from "@/models/resultatLignePrestation";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ idhospitalisation: string }> }) {
    const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
    if (!context) return tenantErrorResponse;
    const { connection } = context;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, "ExamenHospitalisation");
    const LignePrestation = getTenantModel<ILignePrestation>(connection, "LignePrestation");
    const Patient = getTenantModel<IPatient>(connection, "Patient");
    const ResultatLignePrestation = getTenantModel<IResultatLignePrestation>(connection, "ResultatLignePrestation");

    try {
        const { idhospitalisation: idHospitalisation } = await params;

        const examen = await ExamenHospitalisation
            .findById(idHospitalisation)
            .lean();

        if (!examen) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Examen introuvable"
                },
                {
                    status: 404
                }
            );
        }

        const patient = examen.IdPatient
            ? await Patient.findById(examen.IdPatient).lean()
            : null;

        const lignes = await LignePrestation
            .find({ idHospitalisation })
            .sort({ idFamilleActeBiologie: 1, typeResultat: 1, ordonnancementAffichage: 1 })
            .lean();
        const resultat = [];
        for (const ligne of lignes) {
            const paramsResultat = await ResultatLignePrestation
                .find({ IDLIGNE_PRESTATION: ligne._id })
                .sort({ ORdonnacementAffichage: 1 })
                .lean();
            resultat.push({
                prestation: ligne,
                resultats: paramsResultat
            });
        }
        return NextResponse.json({ success: true, examen, patient, lignes: resultat });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                success: false,
                message: "Erreur serveur"
            },
            {
                status: 500
            }
        );
    }
}