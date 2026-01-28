import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Pharmacie } from "@/models/Pharmacie";

// Fonction utilitaire de nettoyage
function cleanNumber(value: any): number {
    if (value === null || value === undefined) return 0;

    // Conversion en string pour uniformiser
    let str = String(value).trim();

    // Remplacement des virgules par des points
    str = str.replace(",", ".");

    // Valeurs considérées comme nulles → 0
    if (["", "N/A", "NA", "--", "-", "null", "undefined"].includes(str.toUpperCase())) {
        return 0;
    }

    // Conversion en nombre
    const num = Number(str);
    return isNaN(num) ? 0 : num;
}

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

        const actes = rows.map((row: any, i: number) => {
            // On accepte plusieurs variantes de noms de colonnes
            const Reference = (row.Reference || row["Reférence"] || row["Reference"] || "").trim();
            const Designation = (row.Designation || row["Désignation"] || row["Designation"] || "").trim();   
            const PrixAchat = cleanNumber(row.PrixAchat || row["PrixAchat"] || row["Prix Achat"]);
            const PrixVente = cleanNumber(row.PrixVente || row["Prix Vente"] || row["Prix Vente"]);

            let rowError = "";
            if (!Reference) rowError += "Champ 'Reference' manquant. ";
            if (!Designation) rowError += "Champ 'Designation' manquant. ";
            if (isNaN(PrixAchat)) rowError += "Champ 'Prix d'achat' invalide. ";
            if (isNaN(PrixVente)) rowError += "Champ 'Prix de vente' invalide. ";          

            if (rowError) errors.push({ index: i + 2, message: rowError.trim() });

            return {
                Reference,
                Designation,
                PrixAchat,
                PrixVente,
            };
        });

        // On garde uniquement les lignes valides
        const validActes = actes.filter((a, i) => !errors.find(e => e.index === i + 2));

        if (validActes.length === 0) {
            return NextResponse.json({ error: "Aucune donnée valide à importer.", details: errors }, { status: 400 });
        }

        // Vérification des doublons déjà en base
        const existing = await Pharmacie.find({
            Designation: { $in: validActes.map(a => a.Designation) },
        }).lean();

        const existingDesignations = new Set(existing.map((a: any) => a.Designation));

        const toInsert = validActes.filter(a => !existingDesignations.has(a.Designation));

        // Marquer les doublons dans les erreurs
        validActes.forEach((a, i) => {
            if (existingDesignations.has(a.Designation)) {
                errors.push({ index: i + 2, message: `Désignation '${a.Designation}' déjà existante.` });
            }
        });

        if (toInsert.length === 0) {
            return NextResponse.json({ error: "Aucun acte inséré.", details: errors }, { status: 409 });
        }

        const inserted = await Pharmacie.insertMany(toInsert);

        return NextResponse.json({
            success: true,
            count: inserted.length,
            ignored: validActes.length - toInsert.length,
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
