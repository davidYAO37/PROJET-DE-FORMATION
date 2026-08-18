import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "biologiste", "technicienlabo"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
    getTenantModel(context.connection, "Patient");

    try {
        const { id } = await params;


        const examen = await ExamenHospitalisation

            .findById(id)
            .populate("IdPatient")
            .lean();

        if (!examen) {
            return NextResponse.json(
                { message: "Examen introuvable" },
                { status: 404 }
            );
        }

        return NextResponse.json(examen);

    } catch (error) {

        console.error("Erreur lors de la recherche de l'examen:", error);

        return NextResponse.json(
            { message: "Erreur serveur" },
            { status: 500 }
        );
    }
}