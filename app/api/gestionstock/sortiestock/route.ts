import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISortieStock } from "@/models/SortieStock";
import { enregistrerSortie, stockErrorResponse, ROLES_MOUVEMENT_PHARMACIE } from "@/lib/stockService";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");
    try {
        const { searchParams } = new URL(req.url);
        const IDMEDICAMENT = searchParams.get("IDMEDICAMENT");
        const reference = searchParams.get("reference");
        const query: any = {};
        if (IDMEDICAMENT) query.IDMEDICAMENT = IDMEDICAMENT;
        if (reference) query.Reference = reference;
        const sorties = await SortieStock.find(query).sort({ DateSortie: -1 }).lean();
        return NextResponse.json(sorties);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// Sortie manuelle (pharmacie) : refusée si le stock est insuffisant
export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    try {
        const body = await req.json();
        const sortie = await enregistrerSortie(context, body);
        return NextResponse.json(sortie, { status: 201 });
    } catch (err: any) {
        return stockErrorResponse(err);
    }
}
