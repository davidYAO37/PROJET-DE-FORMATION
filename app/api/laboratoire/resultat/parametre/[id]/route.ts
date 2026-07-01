import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ResultatLignePrestation } from "@/models/resultatLignePrestation";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;

        const resultat = await ResultatLignePrestation.findById(id);

        if (!resultat) {
            return NextResponse.json(
                { message: "Résultat introuvable" },
                { status: 404 }
            );
        }

        await ResultatLignePrestation.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Paramètre retiré avec succès"
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Erreur serveur lors de la suppression" },
            { status: 500 }
        );
    }
}
