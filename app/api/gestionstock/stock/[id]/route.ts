import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";

// -------------------- MODIFICATION D'UN STOCK --------------------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();

        // Mettre à jour le stock
        const updated = await Stock.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// -------------------- SUPPRESSION D'UN STOCK --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;

        // Vérifier si le stock existe
        const stock = await Stock.findById(id);
        if (!stock) {
            return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
        }

        // Supprimer le stock
        await Stock.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
