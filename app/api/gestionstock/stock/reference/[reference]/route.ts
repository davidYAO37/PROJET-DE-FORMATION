import { NextRequest, NextResponse } from "next/server";
import { IStock } from "@/models/Stock";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "pharmacien", "accueil", "caisse", "comptable"];

// -------------------- RÉCUPÉRER UN STOCK PAR RÉFÉRENCE --------------------
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    try {
        const { reference } = await params;
        
        // Rechercher le stock par référence
        const stock = await Stock.findOne({ Reference: reference }).lean();
        
        if (!stock) {
            return NextResponse.json({ error: "Stock introuvable pour cette référence" }, { status: 404 });
        }
        
        return NextResponse.json(stock);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
