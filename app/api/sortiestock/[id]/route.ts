import { NextRequest, NextResponse } from "next/server";
import { ISortieStock } from "@/models/SortieStock";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { modifierSortie, nettoyerSortieCaisse, supprimerSortie, stockErrorResponse, ROLES_VENTE } from "@/lib/stockService";

// PUT /api/sortiestock/[id] - Mettre à jour une vente : l'écart est répercuté sur le stock
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(request, ROLES_VENTE);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");

    try {
        const { id } = await params;
        const brut = await request.json();
        // Ligne « intégrée » malgré un stock insuffisant : le stock peut devenir négatif (quantité due)
        const autoriserNegatif = brut?.StockNegatifAutorise === true;
        const body = nettoyerSortieCaisse(brut);
        
        const ancienne = await SortieStock.findById(id).lean();
        if (!ancienne) {
            return NextResponse.json({ 
                error: "Sortie de stock introuvable" 
            }, { status: 404 });
        }

        const updated = await modifierSortie(context, ancienne, body, { stockVirtuel: true, autoriserNegatif });
        
        return NextResponse.json({
            success: true,
            data: updated,
            message: "Sortie de stock mise à jour avec succès"
        });
    } catch (error: any) {
        console.error("Erreur PUT /api/sortiestock/[id]:", error);
        return stockErrorResponse(error);
    }
}

// DELETE /api/sortiestock/[id] - Supprimer une vente : la quantité est remise en stock
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(request, ROLES_VENTE);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");

    try {
        const { id } = await params;
        
        const sortie = await SortieStock.findById(id).lean();
        if (!sortie) {
            return NextResponse.json({ 
                error: "Sortie de stock introuvable" 
            }, { status: 404 });
        }

        await supprimerSortie(context, sortie, { stockVirtuel: true }, context.user.email);
        
        return NextResponse.json({
            success: true,
            message: "Sortie de stock supprimée avec succès"
        });
    } catch (error: any) {
        console.error("Erreur DELETE /api/sortiestock/[id]:", error);
        return stockErrorResponse(error);
    }
}
