import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";
import { EntreeStock } from "@/models/EntreeStock";

// GET /api/stock/alertes
// Retourne: ruptures, seuils min dépassés, lots proches péremption (30 jours)
export async function GET(request: NextRequest) {
    await db();

    try {
        const { searchParams } = new URL(request.url);
        const entrepriseId = searchParams.get("entrepriseId");
        const joursPeremption = Number(searchParams.get("joursPeremption") || 30);

        const query: any = {};
        if (entrepriseId) query.entrepriseId = entrepriseId;

        // 1. Ruptures de stock (QteEnStock = 0 ou null)
        const ruptures = await Stock.find({
            ...query,
            $or: [{ QteEnStock: { $lte: 0 } }, { QteEnStock: null }],
        }).lean();

        // 2. Médicaments sous le seuil minimum (stock > 0 mais < min)
        const sousSeuilMin = await Stock.find({
            ...query,
            $and: [
                { QteMinimum: { $gt: 0 } },
                { QteEnStock: { $gt: 0 } },
                { $expr: { $lt: ["$QteEnStock", "$QteMinimum"] } },
            ],
        }).lean();

        // 3. Lots proches de la péremption
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + joursPeremption);
        const entreeQuery: any = { DatePeremption: { $lte: dateLimite, $gt: new Date() } };
        if (entrepriseId) entreeQuery.entrepriseId = entrepriseId;

        const lotsProchesPeremption = await EntreeStock.find(entreeQuery)
            .sort({ DatePeremption: 1 })
            .lean();

        // 4. Lots déjà périmés
        const lotsPerimes = await EntreeStock.find({
            ...( entrepriseId ? { entrepriseId } : {} ),
            DatePeremption: { $lt: new Date() },
        }).lean();

        // 5. Valeur totale du stock
        const tousStocks = await Stock.find(query).lean();
        const valeurTotaleStock = tousStocks.reduce((acc, s) => {
            return acc + (Number(s.QteEnStock || 0) * 0);
        }, 0);

        return NextResponse.json({
            ruptures: ruptures.length,
            rupturesListe: ruptures,
            sousSeuilMin: sousSeuilMin.length,
            sousSeuilMinListe: sousSeuilMin,
            lotsProchesPeremption: lotsProchesPeremption.length,
            lotsProchesPeremptionListe: lotsProchesPeremption,
            lotsPerimes: lotsPerimes.length,
            lotsPerimesListe: lotsPerimes,
            totalMedicamentsEnStock: tousStocks.length,
        });
    } catch (error: any) {
        console.error("Erreur GET /api/stock/alertes:", error);
        return NextResponse.json(
            { error: "Erreur lors du calcul des alertes", details: error.message },
            { status: 500 }
        );
    }
}
