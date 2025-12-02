import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";
import mongoose from "mongoose";

// GET /api/ligneprestationFacture/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    try {
        await db();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "ID invalide", message: "L'identifiant fourni n'est pas valide" },
                { status: 400 }
            );
        }

        const ligne = await LignePrestation.findById(id).lean();

        if (!ligne) {
            return NextResponse.json(
                { error: "Ligne non trouvée", message: "La ligne de prestation n'existe pas" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: ligne,
            message: "Ligne de prestation trouvée",
        });
    } catch (e: any) {
        console.error("❌ Erreur GET /api/ligneprestationFacture/[id]:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de récupérer la ligne de prestation" },
            { status: 500 }
        );
    }
}

// PUT /api/ligneprestationFacture/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const body = await req.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "ID invalide", message: "L'identifiant fourni n'est pas valide" },
                { status: 400 }
            );
        }

        const updated = await LignePrestation.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return NextResponse.json(
                { error: "Ligne introuvable", message: "La ligne de prestation à mettre à jour n'existe pas" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Ligne de prestation mise à jour avec succès",
            data: updated,
        });
    } catch (e: any) {
        console.error("❌ Erreur PUT /api/ligneprestationFacture/[id]:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de mettre à jour la ligne de prestation" },
            { status: 500 }
        );
    }
}

// DELETE /api/ligneprestationFacture/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "ID invalide", message: "L'identifiant fourni n'est pas valide" },
                { status: 400 }
            );
        }

        const deleted = await LignePrestation.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { error: "Ligne introuvable", message: "La ligne de prestation à supprimer n'existe pas" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Ligne de prestation supprimée avec succès",
            data: deleted,
        });
    } catch (e: any) {
        console.error("❌ Erreur DELETE /api/ligneprestationFacture/[id]:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de supprimer la ligne de prestation" },
            { status: 500 }
        );
    }
}
