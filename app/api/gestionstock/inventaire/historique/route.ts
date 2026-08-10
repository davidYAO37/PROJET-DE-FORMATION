import { NextRequest, NextResponse } from "next/server";
import { IHistoriqueInventaire } from "@/models/HistoriqueInventaire";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "pharmacien", "accueil", "caisse", "comptable"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const HistoriqueInventaire = getTenantModel<IHistoriqueInventaire>(context.connection, "HistoriqueInventaire");
    try {
        const historique = await HistoriqueInventaire.find()
            .sort({ DateInventaire: -1 })
            .lean();
        return NextResponse.json(historique);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
