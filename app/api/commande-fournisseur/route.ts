import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { CommandeFournisseur } from "@/models/CommandeFournisseur";

export async function GET(req: NextRequest) {
    await db();
    const { searchParams } = new URL(req.url);
    const statut       = searchParams.get("statut");
    const idFournisseur = searchParams.get("IDFournisseur");

    const query: any = {};
    if (statut)        query.Statut        = statut;
    if (idFournisseur) query.IDFournisseur = idFournisseur;

    const commandes = await CommandeFournisseur.find(query).sort({ DateCommande: -1 }).lean();
    return NextResponse.json(commandes);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        // Générer un numéro de commande automatique si absent
        if (!body.NumeroCommande) {
            const count = await CommandeFournisseur.countDocuments();
            body.NumeroCommande = `CMD-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
        }
        body.SaisiLe = new Date();
        const commande = await CommandeFournisseur.create(body);
        return NextResponse.json(commande, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
