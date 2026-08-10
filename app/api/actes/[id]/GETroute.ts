import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");
    try {
        const { id } = await params;
        
        // Rechercher l'acte par ID
        const acte = await ActeClinique.findById(id).lean();
        
        if (!acte) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }
        
        return NextResponse.json(acte);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
