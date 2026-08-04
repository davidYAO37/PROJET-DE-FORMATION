import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IMedecin } from "@/models/medecin";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");

    try {

        const medecins =
            await Medecin
                .find({})
                .sort({
                    nom: 1,
                    prenoms: 1
                })
                .lean();

        return NextResponse.json(medecins);

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            { message: "Erreur serveur" },
            { status: 500 }
        );
    }
}