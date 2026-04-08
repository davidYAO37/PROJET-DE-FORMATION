import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ParamLabo } from "@/models/paramLabo";

export async function GET(req: NextRequest) {
    await db();
    
    try {
        const paramLabos = await ParamLabo.find({}).sort({ Param_designation: 1 }).lean();
        return NextResponse.json(paramLabos);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    
    try {
        const body = await req.json();
        const newParamLabo = new ParamLabo(body);
        await newParamLabo.save();
        return NextResponse.json(newParamLabo, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
