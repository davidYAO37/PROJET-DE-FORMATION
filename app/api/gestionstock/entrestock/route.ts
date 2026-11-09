import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IEntreeStock } from "@/models/EntreeStock";
import { enregistrerEntree, stockErrorResponse, ROLES_MOUVEMENT_PHARMACIE } from "@/lib/stockService";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    try {
        const { searchParams } = new URL(req.url);
        const idappro = searchParams.get('idappro');
        
        let query = {};
        if (idappro) {
            query = { IDAppro: idappro };
        }
        
        const entreestocks = await EntreeStock.find(query).lean();
        return NextResponse.json(entreestocks);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// Ligne d'achat : crée l'entrée, incrémente le stock (création si besoin) et met à jour les prix du médicament
export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    try {
        const body = await req.json();
        const entree = await enregistrerEntree(context, body, { majPrix: true });
        return NextResponse.json(entree);
    } catch (e: any) {
        return stockErrorResponse(e);
    }
}
