import { NextRequest, NextResponse } from "next/server";
import { ActeClinique } from "@/models/acteclinique";
import { db } from "@/db/mongoConnect";

export async function GET() {
    await db();
    const actes = await ActeClinique.find().lean();
    return NextResponse.json(actes);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const acte = await ActeClinique.create(body);
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
