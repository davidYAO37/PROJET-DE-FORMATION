import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Approvisionnement } from "@/models/Approvisionnement";
import { EntreeStock } from "@/models/EntreeStock";

// -------------------- MODIFICATION D'UN ACHAT ET TOUTES ENTREESTOCK --------------------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();

      

        // Mettre à jour l'approvisionnement
        const updated = await Approvisionnement.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Approvisionnement introuvable" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// -------------------- SUPPRESSION D'UN ACHAT ET TOUS SES ENTREESTOCK --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;

        // Vérifier si l'acte existe
        const acte = await Approvisionnement.findById(id);
        if (!acte) {
            return NextResponse.json({ error: "Achat introuvable" }, { status: 404 });
        }

        // Supprimer l'acte
        await Approvisionnement.findByIdAndDelete(id);

        // Supprimer toutes les entrées de stock associées
        await EntreeStock.deleteMany({ IDAppro: id });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}