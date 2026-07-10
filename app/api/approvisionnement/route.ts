import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Approvisionnement } from "@/models/Approvisionnement";

export async function GET(req: NextRequest) {
    await db();
    const { searchParams } = new URL(req.url);
    const idFournisseur = searchParams.get("IDFournisseur");
    const dateDebut     = searchParams.get("dateDebut");
    const dateFin       = searchParams.get("dateFin");

    const query: any = {};
    if (idFournisseur) query.IDFournisseur = idFournisseur;
    if (dateDebut || dateFin) {
        query.DateAppro = {};
        if (dateDebut) query.DateAppro.$gte = new Date(dateDebut);
        if (dateFin)   query.DateAppro.$lte = new Date(dateFin + "T23:59:59");
    }

    const Approvisionnements = await Approvisionnement.find(query).sort({ DateAppro: -1 }).lean();
    return NextResponse.json(Approvisionnements);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const Approvisionnements = await Approvisionnement.create(body);
        return NextResponse.json(Approvisionnements);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
