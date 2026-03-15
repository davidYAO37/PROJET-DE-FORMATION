import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";

// PUT /api/stock/[id] - Mettre à jour un stock
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
    try {
        const { id } = await params;
        const body = await request.json();
        
        // Validation des champs
        const updateData: any = {};
        
        // Mettre à jour uniquement les champs fournis
        if (body.QteEnStock !== undefined) {
            updateData.QteEnStock = Number(body.QteEnStock);
        }
        
        if (body.QteStockVirtuel !== undefined) {
            updateData.QteStockVirtuel = Number(body.QteStockVirtuel);
        }
        
        if (body.Reference !== undefined) {
            updateData.Reference = body.Reference;
        }
        
        if (body.Medicament !== undefined) {
            updateData.Medicament = body.Medicament;
        }
        
        if (body.IDMEDICAMENT !== undefined) {
            updateData.IDMEDICAMENT = body.IDMEDICAMENT;
        }
        
        // Ajouter les métadonnées de modification
        updateData.AuteurModif = body.AuteurModif || "System";
        updateData.DateModif = new Date();
        
        const updated = await Stock.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return NextResponse.json({ 
                error: "Stock introuvable" 
            }, { status: 404 });
        }
        
        console.log("✅ Stock mis à jour:", updated);
        
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
        
        // Vérifier si le stock existe avant de le supprimer
        const existingStock = await Stock.findById(id);
        
        if (!existingStock) {
            return NextResponse.json({ 
                error: "Stock introuvable" 
            }, { status: 404 });
        }
        
        // Logger la suppression pour audit
        console.log("🗑️ Suppression du stock:", {
            id: existingStock._id,
            reference: existingStock.Reference,
            medicament: existingStock.Medicament,
            qteEnStock: existingStock.QteEnStock,
            dateSuppression: new Date()
        });
        
        const deleted = await Stock.findByIdAndDelete(id);
        
        return NextResponse.json({
            success: true,
            data: deleted,
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
