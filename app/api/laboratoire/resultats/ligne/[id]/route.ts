import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ResultatLignePrestation } from "@/models/resultatLignePrestation";
import { LignePrestation } from "@/models/lignePrestation";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;

        if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
            return NextResponse.json({ hasResultats: false, count: 0, resultats: [] });
        }

        const resultats = await ResultatLignePrestation.find({
            IDLIGNE_PRESTATION: id
        }).lean();

        return NextResponse.json({
            hasResultats: resultats.length > 0,
            count: resultats.length,
            resultats
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Erreur serveur lors de la vérification" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;

        // Supprimer tous les résultats de la ligne de prestation
        const result = await ResultatLignePrestation.deleteMany({
            IDLIGNE_PRESTATION: id
        });

        // Mettre à jour la ligne de prestation
        const ligneUpdate: any = {
            observationExamen: "",
            dateSaisieResultat: null,
            resultatSaisiePar: ""
        };

        const updatedLigne = await LignePrestation.findByIdAndUpdate(
            id,
            ligneUpdate,
            {
                new: true,
                runValidators: true
            }
        );

        return NextResponse.json({
            success: true,
            message: "Résultats annulés avec succès",
            deletedCount: result.deletedCount,
            ligne: updatedLigne
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Erreur serveur lors de l'annulation" },
            { status: 500 }
        );
    }
}
