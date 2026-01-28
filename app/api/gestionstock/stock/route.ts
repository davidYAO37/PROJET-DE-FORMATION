import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";

export async function GET() {
    await db();
    const Stocks = await Stock.find().lean();
    return NextResponse.json(Stocks);
}

export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        const Stocks = await Stock.create(body);
        return NextResponse.json(Stocks);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}