import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { EntreeStock } from "@/models/EntreeStock";
import { Stock } from "@/models/Stock";

export async function POST(req: NextRequest) {
    await db();
    try {
        const body = await req.json();
        const entree = await EntreeStock.create(body);

        // Mise à jour du stock physique
        if (body.IDMEDICAMENT && body.Quantite) {
            const stock = await Stock.findOne({ IDMEDICAMENT: body.IDMEDICAMENT });
            if (stock) {
                await Stock.findByIdAndUpdate(stock._id, {
                    QteEnStock: (stock.QteEnStock ?? 0) + body.Quantite,
                    AuteurModif: body.SaisiPar,
                    DateModif: new Date(),
                });
            }
        }

        return NextResponse.json(entree, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
