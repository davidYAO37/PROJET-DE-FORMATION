import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Pharmacie } from "@/models/Pharmacie";

export async function GET() {
    await db();
    const actes = await Pharmacie.find().lean();
    return NextResponse.json(actes);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const acte = await Pharmacie.create(body);
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
