import { NextRequest, NextResponse } from "next/server";
import { Assurance } from "@/models/assurance";
import { db } from "@/db/mongoConnect";

export async function GET() {
    await db();
    const assurances = await Assurance.find().lean();
    return NextResponse.json(assurances);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const assurance = await Assurance.create(body);
        return NextResponse.json(assurance);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
