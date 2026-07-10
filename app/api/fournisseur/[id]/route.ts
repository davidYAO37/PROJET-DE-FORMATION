import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Fournisseur } from "@/models/Fournisseur";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();
        const updated = await Fournisseur.findByIdAndUpdate(id, body, { new: true });
        if (!updated) return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        await Fournisseur.findByIdAndUpdate(id, { Actif: false });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
