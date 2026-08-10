import { NextRequest, NextResponse } from "next/server";
import { ISortieStock } from "@/models/SortieStock";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const WRITE_ROLES = ["admin", "pharmacien", "caisse"];

// PUT /api/sortiestock/[id] - Mettre à jour une sortie de stock
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(request, WRITE_ROLES);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");

    try {
        const { id } = await params;
        const body = await request.json();
        
        const updated = await SortieStock.findByIdAndUpdate(id, body, { new: true });
        
        if (!updated) {
            return NextResponse.json({ 
                error: "Sortie de stock introuvable" 
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            data: updated,
            message: "Sortie de stock mise à jour avec succès"
        });
    } catch (error: any) {
        console.error("Erreur PUT /api/sortiestock/[id]:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la mise à jour de la sortie de stock",
            details: error.message 
        }, { status: 500 });
    }
}

// DELETE /api/sortiestock/[id] - Supprimer une sortie de stock
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(request, WRITE_ROLES);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");

    try {
        const { id } = await params;
        
        const deleted = await SortieStock.findByIdAndDelete(id);
        
        if (!deleted) {
            return NextResponse.json({ 
                error: "Sortie de stock introuvable" 
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            message: "Sortie de stock supprimée avec succès"
        });
    } catch (error: any) {
        console.error("Erreur DELETE /api/sortiestock/[id]:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la suppression de la sortie de stock",
            details: error.message 
        }, { status: 500 });
    }
}
