import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Pharmacie } from "@/models/Pharmacie";

// -------------------- MODIFICATION D'UN Medicament --------------------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();


        // Mettre à jour l'Medicament
        const updated = await Pharmacie.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Medicament introuvable" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// -------------------- SUPPRESSION D'UN MEDICAMENT  --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;

        // Vérifier si l'Medicament existe
        const Medicament = await Pharmacie.findById(id);
        if (!Medicament) {
            return NextResponse.json({ error: "Medicament introuvable" }, { status: 404 });
        }

        // Supprimer l'Medicament
        await Pharmacie.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}