import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";

// GET /api/stock?reference=xxx&IDMEDICAMENT=xxx
export async function GET(request: Request) {
    await db();
    
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get("reference");
        const IDMEDICAMENT = searchParams.get("IDMEDICAMENT");
        
        let query: any = {};
        
        if (reference) {
            query.Reference = reference;
            const stock = await Stock.findOne(query).lean();
            return NextResponse.json([stock]); // Retourner un tableau pour la cohérence
        }
        
        if (IDMEDICAMENT) {
            query.IDMEDICAMENT = IDMEDICAMENT;
            const stocks = await Stock.find(query).lean();
            return NextResponse.json(stocks);
        }
        
        // Si pas de paramètres, retourner tous les stocks
        const stocks = await Stock.find().lean();
        return NextResponse.json(stocks);
    } catch (error: any) {
        console.error("Erreur GET /api/stock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la récupération des stocks",
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/stock - Créer un nouveau stock
export async function POST(request: Request) {
    await db();
    
    try {
        const body = await request.json();
        
        // Validation des champs requis
        if (!body.IDMEDICAMENT) {
            return NextResponse.json({ 
                error: "IDMEDICAMENT est requis",
                details: "Le champ IDMEDICAMENT est obligatoire pour créer un stock"
            }, { status: 400 });
        }
        
        // Vérifier si un stock existe déjà pour ce médicament
        const existingStock = await Stock.findOne({ IDMEDICAMENT: body.IDMEDICAMENT });
        
        if (existingStock) {
            return NextResponse.json({ 
                error: "Stock déjà existant",
                details: "Un stock existe déjà pour ce médicament. Utilisez PUT pour le mettre à jour.",
                existingStock: existingStock
            }, { status: 409 });
        }
        
        // Préparer les données du nouveau stock
        const stockData: any = {
            IDMEDICAMENT: body.IDMEDICAMENT,
            QteEnStock: Number(body.QteEnStock) || 0,
            QteStockVirtuel: Number(body.QteStockVirtuel) || 0,
            Reference: body.Reference || "",
            Medicament: body.Medicament || "",
            AuteurModif: body.AuteurModif || "System",
            DateModif: new Date()
        };
        
        const newStock = await Stock.create(stockData);
        
        console.log("✅ Nouveau stock créé:", newStock);
        
        return NextResponse.json({
            success: true,
            data: newStock,
            message: "Stock créé avec succès"
        }, { status: 201 });
    } catch (error: any) {
        console.error("Erreur POST /api/stock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la création du stock",
            details: error.message 
        }, { status: 500 });
    }
}
