import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { EntreeStock } from "@/models/EntreeStock";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const idappro = searchParams.get('idappro');
        
        let query = {};
        if (idappro) {
            query = { IDAppro: idappro };
        }
        
        const entreestocks = await EntreeStock.find(query).lean();
        return NextResponse.json(entreestocks);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    
    // Logs de débogage
    console.log("Données reçues dans POST /api/gestionstock/entrestock:", JSON.stringify(body, null, 2));
    
    try {
        const entreestocks = await EntreeStock.create(body);
        console.log("Entrée en stock créée avec succès:", JSON.stringify(entreestocks, null, 2));
        return NextResponse.json(entreestocks);
    } catch (e: any) {
        console.error("Erreur détaillée lors de la création de l'entrée en stock:", {
            message: e.message,
            name: e.name,
            errors: e.errors,
            stack: e.stack
        });
        return NextResponse.json({ 
            error: e.message,
            details: e.errors,
            name: e.name
        }, { status: 400 });
    }
}