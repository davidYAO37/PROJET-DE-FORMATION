import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const search = searchParams.get("search") || "";

    const query: any = {};
    if (search) {
        query.designationacte = { $regex: search, $options: "i" }; // recherche insensible à la casse
    }

    const total = await ActeClinique.countDocuments(query);
    const actes = await ActeClinique.find(query)
        .sort({ designationacte: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return NextResponse.json({
        data: actes,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
    });
}
