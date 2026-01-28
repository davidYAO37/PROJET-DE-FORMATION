import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";

// -------------------- RÉCUPÉRER UN STOCK PAR RÉFÉRENCE --------------------
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
    await db();
    try {
        const { reference } = await params;
        
        // Rechercher le stock par référence
        const stock = await Stock.findOne({ Reference: reference }).lean();
        
        if (!stock) {
            return NextResponse.json({ error: "Stock introuvable pour cette référence" }, { status: 404 });
        }
        
        return NextResponse.json(stock);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
