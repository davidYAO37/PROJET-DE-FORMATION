import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { SortieStock } from "@/models/SortieStock";
import { Stock } from "@/models/Stock";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();
        const ancienne = await SortieStock.findById(id);
        const updated = await SortieStock.findByIdAndUpdate(id, body, { new: true });

        // Recalculer le stock si quantité ou médicament changé
        const idMed = body.IDMEDICAMENT || ancienne?.IDMEDICAMENT;
        if (idMed && ancienne) {
            const diff = (ancienne.Quantite ?? 0) - (body.Quantite ?? ancienne.Quantite ?? 0);
            const stock = await Stock.findOne({ IDMEDICAMENT: idMed });
            if (stock) {
                await Stock.findByIdAndUpdate(stock._id, {
                    QteEnStock: Math.max(0, (stock.QteEnStock ?? 0) + diff),
                    AuteurModif: body.SaisiPar,
                    DateModif: new Date(),
                });
            }
        }
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const sortie = await SortieStock.findById(id);
        await SortieStock.findByIdAndDelete(id);

        // Remettre la quantité en stock
        if (sortie?.IDMEDICAMENT && sortie.Quantite) {
            const stock = await Stock.findOne({ IDMEDICAMENT: sortie.IDMEDICAMENT });
            if (stock) {
                await Stock.findByIdAndUpdate(stock._id, {
                    QteEnStock: (stock.QteEnStock ?? 0) + sortie.Quantite,
                    DateModif: new Date(),
                });
            }
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
