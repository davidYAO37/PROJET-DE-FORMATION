import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IEntreeStock } from "@/models/EntreeStock";
import { IStock } from "@/models/Stock";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
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
