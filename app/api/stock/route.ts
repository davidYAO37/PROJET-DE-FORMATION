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
        
        const newStock = await Stock.create(body);
        
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
