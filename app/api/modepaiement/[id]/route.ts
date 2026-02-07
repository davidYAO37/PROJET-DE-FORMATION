import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ModeDePaiement } from "@/models/ModeDePaiement";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const body = await req.json();
    const { id } = await params;
    try {
        const modepaiements = await ModeDePaiement.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json(modepaiements);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const { id } = await params;
    try {
        await ModeDePaiement.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
