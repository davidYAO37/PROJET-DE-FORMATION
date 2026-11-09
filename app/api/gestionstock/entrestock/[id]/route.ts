import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IEntreeStock } from "@/models/EntreeStock";
import { annulerEntree, stockErrorResponse, ROLES_MOUVEMENT_PHARMACIE } from "@/lib/stockService";

// -------------------- SUPPRESSION D'UNE ENTRÉE EN STOCK --------------------
// La quantité est retirée du stock ; refusé si elle a déjà été consommée.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    try {
        const { id } = await params;

        // Vérifier si l'entrée en stock existe
        const entreeStock = await EntreeStock.findById(id).lean();
        if (!entreeStock) {
            return NextResponse.json({ error: "Entrée en stock introuvable" }, { status: 404 });
        }

        await annulerEntree(context, entreeStock, context.user.email);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return stockErrorResponse(err);
    }
}
