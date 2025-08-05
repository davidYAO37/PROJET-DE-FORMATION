import { NextRequest, NextResponse } from "next/server";
import { Assurance } from "@/models/assurance";
import { db } from "@/db/mongoConnect";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const body = await req.json();
    const { id } = await params;
    try {
        const assurance = await Assurance.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json(assurance);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const { id } = await params;
    try {
        await Assurance.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
