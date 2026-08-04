import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IFournisseur } from "@/models/Fournisseur";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Fournisseur = getTenantModel<IFournisseur>(context.connection, "Fournisseur");
    try {
        const { searchParams } = new URL(req.url);
        const actif = searchParams.get("actif");
        const query: any = {};
        if (actif === "true") query.Actif = true;
        const fournisseurs = await Fournisseur.find(query).sort({ Nom: 1 }).lean();
        return NextResponse.json(fournisseurs);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Fournisseur = getTenantModel<IFournisseur>(context.connection, "Fournisseur");
    try {
        const body = await req.json();
        const fournisseur = await Fournisseur.create(body);
        return NextResponse.json(fournisseur, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
