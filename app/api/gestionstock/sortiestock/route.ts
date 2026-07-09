import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { SortieStock } from "@/models/SortieStock";
import { Stock } from "@/models/Stock";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const IDMEDICAMENT = searchParams.get("IDMEDICAMENT");
        const reference = searchParams.get("reference");
        const query: any = {};
        if (IDMEDICAMENT) query.IDMEDICAMENT = IDMEDICAMENT;
        if (reference) query.Reference = reference;
        const sorties = await SortieStock.find(query).sort({ DateSortie: -1 }).lean();
        return NextResponse.json(sorties);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    try {
        const body = await req.json();
        const sortie = await SortieStock.create(body);

        // Mise à jour du stock physique
        if (body.IDMEDICAMENT && body.Quantite) {
            const stock = await Stock.findOne({ IDMEDICAMENT: body.IDMEDICAMENT });
            if (stock) {
                const nouvelleQte = Math.max(0, (stock.QteEnStock ?? 0) - body.Quantite);
                await Stock.findByIdAndUpdate(stock._id, {
                    QteEnStock: nouvelleQte,
                    AuteurModif: body.SaisiPar,
                    DateModif: new Date(),
                });
            }
        }

        return NextResponse.json(sortie, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
