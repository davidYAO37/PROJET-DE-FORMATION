import { NextRequest, NextResponse } from "next/server";
import { ActeClinique } from "@/models/acteclinique";
import { db } from "@/db/mongoConnect";

export async function POST(req: NextRequest) {
    await db();
    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
        return NextResponse.json({ error: "Format de données invalide : le champ 'rows' doit être un tableau." }, { status: 400 });
    }
    try {
        // Validation détaillée ligne par ligne
        const errors: { index: number, message: string }[] = [];
        const actes = rows.map((row: any, i: number) => {
            const designationacte = row.designationacte || row["Désignation"] || row["designationacte"];
            const lettreCle = row.lettreCle || row["Lettre Clé"] || row["lettreCle"];
            const coefficient = Number(row.coefficient || row["Coefficient"] || row["coefficient"]);
            const prixClinique = Number(row.prixClinique || row["Prix Clinique"] || row["prixClinique"]);
            const prixMutuel = Number(row.prixMutuel || row["Prix Mutuel"] || row["prixMutuel"]);
            const prixPreferenciel = Number(row.prixPreferenciel || row["Prix Préférentiel"] || row["prixPreferenciel"]);

            let rowError = "";
            if (!designationacte) rowError += "Champ 'designationacte' manquant. ";
            if (!lettreCle) rowError += "Champ 'lettreCle' manquant. ";
            if (isNaN(coefficient)) rowError += "Champ 'coefficient' invalide. ";
            if (isNaN(prixClinique)) rowError += "Champ 'prixClinique' invalide. ";
            if (isNaN(prixMutuel)) rowError += "Champ 'prixMutuel' invalide. ";
            if (isNaN(prixPreferenciel)) rowError += "Champ 'prixPreferenciel' invalide. ";
            if (rowError) errors.push({ index: i + 2, message: rowError.trim() }); // +2 pour Excel (header + 1-based)

            return {
                designationacte,
                lettreCle,
                coefficient,
                prixClinique,
                prixMutuel,
                prixPreferenciel,
            };
        });

        // On ne garde que les lignes valides
        const validActes = actes.filter((a, i) => !errors.find(e => e.index === i + 2));

        if (validActes.length === 0) {
            return NextResponse.json({ error: "Aucune donnée valide à importer.", details: errors }, { status: 400 });
        }

        // Vérification des doublons dans la base (uniquement sur 'designationacte')
        const existing = await ActeClinique.find({
            designationacte: { $in: validActes.map(a => a.designationacte) }
        }).lean();
        const existingDesignations = new Set(existing.map((a: any) => a.designationacte));
        const toInsert = validActes.filter(a => !existingDesignations.has(a.designationacte));

        // Ajout d'erreurs pour les doublons détectés (uniquement sur 'designationacte')
        validActes.forEach((a, i) => {
            if (existingDesignations.has(a.designationacte)) {
                errors.push({ index: i + 2, message: `Désignation '${a.designationacte}' déjà existante.` });
            }
        });

        if (toInsert.length === 0) {
            return NextResponse.json({ error: "Aucun acte inséré.", details: errors }, { status: 409 });
        }

        const inserted = await ActeClinique.insertMany(toInsert);
        return NextResponse.json({
            success: true,
            count: inserted.length,
            ignored: validActes.length - toInsert.length,
            errors,
        });
    } catch (e: any) {
        if (e.code === 11000) {
            return NextResponse.json({ error: "Doublon détecté dans la base de données.", details: e.keyValue }, { status: 409 });
        }
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
