import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IModeDePaiement } from "@/models/ModeDePaiement";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {

    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ModeDePaiement = getTenantModel<IModeDePaiement>(context.connection, "ModeDePaiement");

    const modepaiements = await ModeDePaiement.find().lean();

    return NextResponse.json({
        success: true,
        data: modepaiements
    });

}



export async function POST(req: NextRequest) {

    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ModeDePaiement = getTenantModel<IModeDePaiement>(context.connection, "ModeDePaiement");

    const body = await req.json();

    try {

        const modepaiements = await ModeDePaiement.create(body);

        return NextResponse.json(modepaiements);

    } catch (e: any) {

        return NextResponse.json({ error: e.message }, { status: 400 });

    }

}

