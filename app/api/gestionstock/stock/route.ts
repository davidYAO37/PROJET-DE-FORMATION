import { NextRequest, NextResponse } from "next/server";
import { IStock } from "@/models/Stock";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "pharmacien", "accueil", "caisse", "comptable"];
const WRITE_ROLES = ["admin", "pharmacien"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    const Stocks = await Stock.find().lean();
    return NextResponse.json(Stocks);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES, { actions: ["parametrage_pharmacie"] });
    if (!context) return response;
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    const body = await req.json();
    try {
        // Une seule ligne de stock par médicament
        if (body.IDMEDICAMENT) {
            const existant = await Stock.findOne({ IDMEDICAMENT: body.IDMEDICAMENT }).lean();
            if (existant) {
                return NextResponse.json({ error: "Un stock existe déjà pour ce médicament", existingStock: existant }, { status: 409 });
            }
        }
        const Stocks = await Stock.create(body);
        return NextResponse.json(Stocks);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}