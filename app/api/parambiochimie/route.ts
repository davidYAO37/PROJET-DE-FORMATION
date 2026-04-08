import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ParamBiochimie } from "@/models/paramBiochimie";

export async function GET(req: NextRequest) {
    await db();
    
    try {
        const paramBiochimies = await ParamBiochimie.find({}).sort({ CodeB: 1 }).lean();
        return NextResponse.json(paramBiochimies);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    
    try {
        const body = await req.json();
        const newParamBiochimie = new ParamBiochimie(body);
        await newParamBiochimie.save();
        return NextResponse.json(newParamBiochimie, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
