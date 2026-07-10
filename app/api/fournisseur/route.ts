import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Fournisseur } from "@/models/Fournisseur";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const actif = searchParams.get("actif");
        const query: any = {};
        if (actif === "true") query.Actif = true;
        const fournisseurs = await Fournisseur.find(query).sort({ Nom: 1 }).lean();
        return NextResponse.json(fournisseurs);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    try {
        const body = await req.json();
        const fournisseur = await Fournisseur.create(body);
        return NextResponse.json(fournisseur, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
