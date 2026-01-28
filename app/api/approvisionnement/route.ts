import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Approvisionnement } from "@/models/Approvisionnement";

export async function GET() {
    await db();
    const Approvisionnements = await Approvisionnement.find().lean();
    return NextResponse.json(Approvisionnements);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const Approvisionnements = await Approvisionnement.create(body);
        return NextResponse.json(Approvisionnements);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
