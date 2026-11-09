import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISortieStock } from "@/models/SortieStock";
import { modifierSortie, supprimerSortie, stockErrorResponse, ROLES_MOUVEMENT_PHARMACIE } from "@/lib/stockService";

// Modification : l'écart (en unités, médicament éventuellement changé) est répercuté sur le stock
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");
    try {
        const { id } = await params;
        const body = await req.json();
        const ancienne = await SortieStock.findById(id).lean();
        if (!ancienne) return NextResponse.json({ error: "Sortie de stock introuvable" }, { status: 404 });
        const updated = await modifierSortie(context, ancienne, body);
        return NextResponse.json(updated);
    } catch (err: any) {
        return stockErrorResponse(err);
    }
}

// Suppression : la quantité est remise en stock
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");
    try {
        const { id } = await params;
        const sortie = await SortieStock.findById(id).lean();
        if (!sortie) return NextResponse.json({ error: "Sortie de stock introuvable" }, { status: 404 });
        await supprimerSortie(context, sortie, {}, context.user.email);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return stockErrorResponse(err);
    }
}
