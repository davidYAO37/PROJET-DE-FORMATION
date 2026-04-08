import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ParamBiochimie } from "@/models/paramBiochimie";

export async function POST(req: NextRequest) {
    await db();
    const { rows } = await req.json();

    if (!Array.isArray(rows)) {
        return NextResponse.json(
            { error: "Format de données invalide : le champ 'rows' doit être un tableau." },
            { status: 400 }
        );
    }

    try {
        const errors: { index: number; message: string }[] = [];

        const paramBiochimies = rows.map((row: any, i: number) => {
            // On accepte les deux premières colonnes comme CodeB et LibelleB
            const CodeB = (row.CodeB || row["Code"] || row["Code B"] || "").trim();
            const LibelleB = (row.LibelleB || row["Libellé"] || row["Libelle"] || row["Libelle B"] || "").trim();

            let rowError = "";
            if (!LibelleB) rowError += "Champ 'Libellé' manquant. ";

            if (rowError) errors.push({ index: i + 2, message: rowError.trim() });

            return {
                CodeB: CodeB || undefined,
                LibelleB,
            };
        });

        // On garde uniquement les lignes valides
        const validParamBiochimies = paramBiochimies.filter((a, i) => !errors.find(e => e.index === i + 2));

        if (validParamBiochimies.length === 0) {
            return NextResponse.json({ error: "Aucune donnée valide à importer.", details: errors }, { status: 400 });
        }

        // Vérification des doublons déjà en base
        const existing = await ParamBiochimie.find({
            $or: [
                { CodeB: { $in: validParamBiochimies.filter(a => a.CodeB).map(a => a.CodeB) } },
                { LibelleB: { $in: validParamBiochimies.map(a => a.LibelleB) } }
            ]
        }).lean();

        const existingCodes = new Set(existing.map((a: any) => a.CodeB).filter(Boolean));
        const existingLibelles = new Set(existing.map((a: any) => a.LibelleB));

        const toInsert = validParamBiochimies.filter(a => 
            !existingCodes.has(a.CodeB) && !existingLibelles.has(a.LibelleB)
        );

        // Marquer les doublons dans les erreurs
        validParamBiochimies.forEach((a, i) => {
            if (a.CodeB && existingCodes.has(a.CodeB)) {
                errors.push({ index: i + 2, message: `Code '${a.CodeB}' déjà existant.` });
            }
            if (existingLibelles.has(a.LibelleB)) {
                errors.push({ index: i + 2, message: `Libellé '${a.LibelleB}' déjà existant.` });
            }
        });

        if (toInsert.length === 0) {
            return NextResponse.json({
                success: false,
                count: 0,
                ignored: validParamBiochimies.length,
                errors,
                message: "Aucun paramètre inséré - tous les enregistrements sont des doublons"
            });
        }

        const inserted = await ParamBiochimie.insertMany(toInsert);

        return NextResponse.json({
            success: true,
            count: inserted.length,
            ignored: validParamBiochimies.length - toInsert.length,
            errors,
        });
    } catch (e: any) {
        if (e.code === 11000) {
            return NextResponse.json(
                { error: "Doublon détecté dans la base de données.", details: e.keyValue },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
