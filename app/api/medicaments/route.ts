import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IPharmacie } from "@/models/Pharmacie";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien", "caisse"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");
    const actes = await Pharmacie.find().lean();
    return NextResponse.json(actes);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");
    const body = await req.json();
    try {
        const acte = await Pharmacie.create(body);
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
