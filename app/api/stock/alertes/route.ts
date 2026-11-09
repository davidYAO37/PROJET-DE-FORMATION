import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IStock } from "@/models/Stock";
import { IEntreeStock } from "@/models/EntreeStock";
import { IPharmacie } from "@/models/Pharmacie";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien"];

// GET /api/stock/alertes
// Retourne: ruptures, seuils min dépassés, lots proches péremption (30 jours)
export async function GET(request: NextRequest) {
    const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
    if (!context) return tenantErrorResponse;
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");

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

        // 2. Médicaments au seuil minimum ou en dessous (stock > 0 mais <= min), comme les badges des écrans
        const sousSeuilMin = await Stock.find({
            ...query,
            $and: [
                { QteMinimum: { $gt: 0 } },
                { QteEnStock: { $gt: 0 } },
                { $expr: { $lte: ["$QteEnStock", "$QteMinimum"] } },
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

        // 5. Valeur totale du stock (quantité en unités x prix d'achat unitaire du médicament)
        const tousStocks = await Stock.find(query).lean();
        const ids = tousStocks.map((s) => s.IDMEDICAMENT).filter(Boolean);
        const prixParMed = new Map(
            (await Pharmacie.find({ _id: { $in: ids } }).select("PrixAchat").lean<any[]>())
                .map((m) => [String(m._id), Number(m.PrixAchat) || 0])
        );
        const valeurTotaleStock = tousStocks.reduce((acc, s) => {
            const qte = Math.max(0, Number(s.QteEnStock || 0));
            return acc + qte * (prixParMed.get(String(s.IDMEDICAMENT)) || 0);
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
            valeurTotaleStock,
        });
    } catch (error: any) {
        console.error("Erreur GET /api/stock/alertes:", error);
        return NextResponse.json(
            { error: "Erreur lors du calcul des alertes", details: error.message },
            { status: 500 }
        );
    }
}
