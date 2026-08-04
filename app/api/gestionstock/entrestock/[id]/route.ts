import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IEntreeStock } from "@/models/EntreeStock";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

// -------------------- SUPPRESSION D'UNE ENTRÉE EN STOCK --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    try {
        const { id } = await params;

        // Vérifier si l'entrée en stock existe
        const entreeStock = await EntreeStock.findById(id);
        if (!entreeStock) {
            return NextResponse.json({ error: "Entrée en stock introuvable" }, { status: 404 });
        }

        // Supprimer l'entrée en stock
        await EntreeStock.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
