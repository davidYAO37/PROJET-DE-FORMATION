import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { SortieStock } from "@/models/SortieStock";

// GET /api/sortiestock?reference=xxx&IDPRESCRIPTION=xxx
export async function GET(request: Request) {
    await db();
    
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get("reference");
        const IDPRESCRIPTION = searchParams.get("IDPRESCRIPTION");
        const Patient = searchParams.get("Patient");
        
        let query: any = {};
        
        if (reference && reference.trim() !== "") query.Reference = reference;
        if (IDPRESCRIPTION && IDPRESCRIPTION.trim() !== "" && IDPRESCRIPTION !== "undefined") query.Prescription = IDPRESCRIPTION;
        if (Patient && Patient.trim() !== "" && Patient !== "undefined") query.Patient = Patient;
        
        const sortiesStock = await SortieStock.find(query).lean();
        
        return NextResponse.json(sortiesStock);
    } catch (error: any) {
        console.error("Erreur GET /api/sortiestock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la récupération des sorties de stock",
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/sortiestock - Créer une nouvelle sortie de stock
export async function POST(request: NextRequest) {
    await db();
    
    try {
        const body = await request.json();
        
        // Mapper les champs et gérer les ObjectId
        const sortieStockData: any = {
            ...body
        };
        
        // Gérer les champs ObjectId - ne les inclure que s'ils sont valides
        if (body.Prescription && body.Prescription.trim() !== "" && body.Prescription !== "undefined") {
            sortieStockData.Prescription = body.Prescription;
        } else {
            delete sortieStockData.Prescription;
        }
        
        if (body.Patient && body.Patient.trim() !== "" && body.Patient !== "undefined") {
            sortieStockData.Patient = body.Patient;
        } else {
            delete sortieStockData.Patient;
        }
        
        // Créer une nouvelle sortie de stock
        const newSortieStock = await SortieStock.create(sortieStockData);
        
        return NextResponse.json({
            success: true,
            data: newSortieStock,
            message: "Sortie de stock créée avec succès"
        }, { status: 201 });
    } catch (error: any) {
        console.error("Erreur POST /api/sortiestock:", error);
        return NextResponse.json({
            error: "Erreur lors de la création de la sortie de stock",
            details: error.message 
        }, { status: 500 });
    }
}

/* // PUT /api/sortiestock/[id] - Mettre à jour une sortie de stock
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
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
        console.error("Erreur PUT /api/sortiestock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la mise à jour de la sortie de stock",
            details: error.message 
        }, { status: 500 });
    }
}
 */
/* // DELETE /api/sortiestock/[id] - Supprimer une sortie de stock
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
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
        console.error("Erreur DELETE /api/sortiestock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la suppression de la sortie de stock",
            details: error.message 
        }, { status: 500 });
    }
}
 */