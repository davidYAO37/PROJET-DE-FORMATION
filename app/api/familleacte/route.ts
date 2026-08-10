import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IFamilleActe } from "@/models/familleActe";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

// GET toutes les famille actes bilogique
export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const FamilleActe = getTenantModel<IFamilleActe>(context.connection, "FamilleActe");
    const actes = await FamilleActe.find().sort({ Description: 1 });
    return NextResponse.json(actes);
}

// POST ajout d’un type d’acte
export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const FamilleActe = getTenantModel<IFamilleActe>(context.connection, "FamilleActe");
    try {
        const body = await req.json();
        const { Description } = body;

        if (!Description) {
            return NextResponse.json({ error: "La description est obligatoire" }, { status: 400 });
        }

        const newActe = new FamilleActe({ Description });
        await newActe.save();

        return NextResponse.json(newActe, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
