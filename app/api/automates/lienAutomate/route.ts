import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LienAutomate } from "@/models/lienAutomate";

export async function GET() {
    try {
        await db();
        const lien = await LienAutomate.findOne().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: lien || {} });
    } catch (error) {
        console.error("Erreur GET LienAutomate:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { nLienNFS, LienHormone, LienVS, LienBiochimie } = body;

        const existing = await LienAutomate.findOne();
        if (existing) {
            existing.nLienNFS = nLienNFS;
            existing.LienHormone = LienHormone;
            existing.LienVS = LienVS;
            existing.LienBiochimie = LienBiochimie;
            await existing.save();
            return NextResponse.json({ success: true, data: existing, message: "Liens mis à jour" });
        }

        const nouveau = await LienAutomate.create({ nLienNFS, LienHormone, LienVS, LienBiochimie });
        return NextResponse.json({ success: true, data: nouveau, message: "Liens créés" }, { status: 201 });
    } catch (error) {
        console.error("Erreur POST LienAutomate:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}
