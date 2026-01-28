import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { EntreeStock } from "@/models/EntreeStock";

// -------------------- SUPPRESSION D'UNE ENTRÉE EN STOCK --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;

        // Vérifier si l'entrée en stock existe
        const entreeStock = await EntreeStock.findById(id);
        if (!entreeStock) {
            return NextResponse.json({ error: "Entrée en stock introuvable" }, { status: 404 });
        }

        // Supprimer l'entrée en stock
        await EntreeStock.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
