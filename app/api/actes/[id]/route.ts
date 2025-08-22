import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();
        const updated = await ActeClinique.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const deleted = await ActeClinique.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}