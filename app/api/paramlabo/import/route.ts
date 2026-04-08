import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ParamLabo } from "@/models/paramLabo";

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

        const paramLabos = rows.map((row: any, i: number) => {
            // On accepte les deux premières colonnes comme Param_designation et ValeurNormale
            const Param_designation = (row.Param_designation || row["Paramètre"] || row["Parametre"] || "").trim();
            const ValeurNormale = (row.ValeurNormale || row["Valeur Normale"] || row["Valeur"] || "").trim();

            let rowError = "";
            if (!Param_designation) rowError += "Champ 'Paramètre' manquant. ";

            if (rowError) errors.push({ index: i + 2, message: rowError.trim() });

            return {
                Param_designation,
                ValeurNormale: ValeurNormale || "",
                TypeTexte: false, // Par défaut
            };
        });

        // On garde uniquement les lignes valides
        const validParamLabos = paramLabos.filter((a, i) => !errors.find(e => e.index === i + 2));

        if (validParamLabos.length === 0) {
            return NextResponse.json({ error: "Aucune donnée valide à importer.", details: errors }, { status: 400 });
        }

        // Vérification des doublons déjà en base
        const existing = await ParamLabo.find({
            Param_designation: { $in: validParamLabos.map(a => a.Param_designation) },
        }).lean();

        const existingDesignations = new Set(existing.map((a: any) => a.Param_designation));

        const toInsert = validParamLabos.filter(a => !existingDesignations.has(a.Param_designation));

        // Marquer les doublons dans les erreurs
        validParamLabos.forEach((a, i) => {
            if (existingDesignations.has(a.Param_designation)) {
                errors.push({ index: i + 2, message: `Paramètre '${a.Param_designation}' déjà existant.` });
            }
        });

        if (toInsert.length === 0) {
            return NextResponse.json({ error: "Aucun paramètre inséré.", details: errors }, { status: 409 });
        }

        const inserted = await ParamLabo.insertMany(toInsert);

        return NextResponse.json({
            success: true,
            count: inserted.length,
            ignored: validParamLabos.length - toInsert.length,
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
