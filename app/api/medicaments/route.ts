import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { accesCatalogueMedicaments } from "@/lib/medicamentsAccess";
import { getTenantModel } from "@/lib/tenantModels";
import { IPharmacie } from "@/models/Pharmacie";
import mongoose from "mongoose";
import { accentInsensitiveRegex } from "@/lib/searchText";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien", "caisse"];

// GET /api/medicaments
//   sans paramètre               -> tout le catalogue (compatibilité)
//   ?q=parac&limit=50&skip=0     -> recherche paginée (désignation / référence, sans accents)
//   ?ids=id1,id2                 -> médicaments précis
// Le nombre total de résultats est renvoyé dans l'en-tête X-Total-Count.
export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const ids = searchParams.get("ids");
    const limitParam = searchParams.get("limit");

    if (q === null && ids === null && limitParam === null) {
        const actes = await Pharmacie.find().lean();
        return NextResponse.json(actes);
    }

    const query: Record<string, any> = {};
    if (ids !== null) {
        query._id = { $in: ids.split(",").filter((id) => mongoose.Types.ObjectId.isValid(id)) };
    }
    if (q && q.trim()) {
        const regex = accentInsensitiveRegex(q);
        query.$or = [{ Designation: regex }, { Reference: regex }];
    }
    const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 500);
    const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

    const [items, total] = await Promise.all([
        Pharmacie.find(query).sort({ Designation: 1 }).skip(skip).limit(ids !== null && !limitParam ? 0 : limit).lean(),
        Pharmacie.countDocuments(query),
    ]);
    return NextResponse.json(items, { headers: { "X-Total-Count": String(total) } });
}

export async function POST(req: NextRequest) {
    const { context, response } = await accesCatalogueMedicaments(req, ROLES);
    if (!context) return response;
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");
    const body = await req.json();
    try {
        const acte = await Pharmacie.create(body);
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
