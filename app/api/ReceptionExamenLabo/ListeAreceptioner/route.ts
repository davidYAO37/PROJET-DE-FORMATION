import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");

    try {
        const { searchParams } = new URL(req.url);

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "Paramètres manquants", message: "startDate et endDate sont requis." },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const receptions = await ExamenHospitalisation.find({
            Designationtypeacte: 'EXAMEN BIOLOGIQUE',
            StatutLaboratoire: 1,
            DatePres: {
                $gte: start,
                $lte: end,
            },
        }).lean();

        return NextResponse.json(receptions);
    } catch (error) {
        console.error("Erreur GET examens reception:", error);
        return NextResponse.json(
            { error: "Erreur serveur", message: String(error) },
            { status: 500 }
        );
    }
}
