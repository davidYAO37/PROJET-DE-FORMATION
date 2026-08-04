import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISortieStock } from "@/models/SortieStock";
import { IStock } from "@/models/Stock";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");
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
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
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
