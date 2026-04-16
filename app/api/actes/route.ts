import { NextRequest, NextResponse } from "next/server";
import { ActeClinique } from "@/models/acteclinique";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();
    
    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(req.url);
    const consultationviste = searchParams.get('consultationviste');
    
    // Construire le filtre
    let filter: any = {};
    if (consultationviste !== null) {
        filter.consultationviste = consultationviste === 'true';
    }
    
    const actes = await ActeClinique.find(filter).lean();
    return NextResponse.json(actes);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const acte = await ActeClinique.create(body);
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
