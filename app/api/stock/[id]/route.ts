import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";

// PUT /api/stock/[id] - Mettre à jour un stock
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
    try {
        const { id } = await params;
        const body = await request.json();
        
        const updated = await Stock.findByIdAndUpdate(id, body, { new: true });
        
        if (!updated) {
            return NextResponse.json({ 
                error: "Stock introuvable" 
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            data: updated,
            message: "Stock mis à jour avec succès"
        });
    } catch (error: any) {
        console.error("Erreur PUT /api/stock/[id]:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la mise à jour du stock",
            details: error.message 
        }, { status: 500 });
    }
}

// DELETE /api/stock/[id] - Supprimer un stock
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
    try {
        const { id } = await params;
        
        const deleted = await Stock.findByIdAndDelete(id);
        
        if (!deleted) {
            return NextResponse.json({ 
                error: "Stock introuvable" 
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            message: "Stock supprimé avec succès"
        });
    } catch (error: any) {
        console.error("Erreur DELETE /api/stock/[id]:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la suppression du stock",
            details: error.message 
        }, { status: 500 });
    }
}
