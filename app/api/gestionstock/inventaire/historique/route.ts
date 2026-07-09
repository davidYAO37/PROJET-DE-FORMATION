import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { HistoriqueInventaire } from "@/models/HistoriqueInventaire";

export async function GET() {
    await db();
    try {
        const historique = await HistoriqueInventaire.find()
            .sort({ DateInventaire: -1 })
            .lean();
        return NextResponse.json(historique);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
