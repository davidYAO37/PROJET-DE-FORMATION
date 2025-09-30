import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    await db();

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
        .limit(limit);

    return NextResponse.json({
        data: actes,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
    });
}
