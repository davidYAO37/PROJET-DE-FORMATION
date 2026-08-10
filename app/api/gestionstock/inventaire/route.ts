import { NextRequest, NextResponse } from "next/server";
import { IStock } from "@/models/Stock";
import { IEntreeStock } from "@/models/EntreeStock";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "pharmacien", "accueil", "caisse", "comptable"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");

    const stocks = await Stock.find().lean();

    // Pour chaque médicament en stock, récupérer la dernière entrée (lot, péremption, prix)
    const inventaire = await Promise.all(
        stocks.map(async (s: any) => {
            const derniere = await EntreeStock.findOne(
                { IDMEDICAMENT: s.IDMEDICAMENT },
                null,
                { sort: { DateAppro: -1 } }
            ).lean() as any;

            const qte = s.QteEnStock ?? 0;
            const min = s.QteMinimum ?? 0;
            const max = s.QteMaximum ?? 0;
            const prixAchat = derniere?.PrixAchat ?? 0;
            const prixVente = derniere?.PrixVente ?? 0;
            const valeurStock = qte * prixAchat;

            let statut = "OK";
            if (qte <= 0) statut = "RUPTURE";
            else if (min > 0 && qte <= min) statut = "CRITIQUE";
            else if (max > 0 && qte >= max) statut = "SURSTOCK";

            const datePeremption = derniere?.DatePeremption ?? null;
            let peremeProche = false;
            if (datePeremption) {
                const diff = (new Date(datePeremption).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                peremeProche = diff <= 90;
            }

            return {
                _id: s._id,
                IDMEDICAMENT: s.IDMEDICAMENT,
                Medicament: s.Medicament,
                Reference: s.Reference,
                QteEnStock: qte,
                QteMinimum: min,
                QteMaximum: max,
                PrixAchat: prixAchat,
                PrixVente: prixVente,
                ValeurStock: valeurStock,
                NumeroLot: derniere?.NumeroLot ?? "",
                DatePeremption: datePeremption,
                PeremeProche: peremeProche,
                Statut: statut,
                DateModif: s.DateModif ?? s.updatedAt,
            };
        })
    );

    // Trier par statut critique en premier, puis alphabétique
    const ordre: Record<string, number> = { RUPTURE: 0, CRITIQUE: 1, SURSTOCK: 2, OK: 3 };
    inventaire.sort((a, b) => (ordre[a.Statut] ?? 9) - (ordre[b.Statut] ?? 9) || (a.Medicament ?? "").localeCompare(b.Medicament ?? ""));

    return NextResponse.json(inventaire);
}
