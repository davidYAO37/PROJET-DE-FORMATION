import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ModeDePaiement } from "@/models/ModeDePaiement";

export async function GET() {
    await db();
    const modepaiements = await ModeDePaiement.find().lean();
    return NextResponse.json(modepaiements);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const modepaiements = await ModeDePaiement.create(body);
        return NextResponse.json(modepaiements);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
