import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IParamLabo } from "@/models/paramLabo";

const WRITE_ROLES = ["admin"];

const RTF_DESTINATIONS = new Set([
    "fonttbl",
    "colortbl",
    "stylesheet",
    "info",
    "generator",
    "pict",
    "object",
    "header",
    "footer",
]);

function rtfToText(value: unknown): string {
    const input = String(value ?? "");
    if (!/^\s*\{\\rtf/i.test(input)) return input.trim();

    const output: string[] = [];
    const skippedGroups: boolean[] = [];
    let skipGroup = false;

    for (let index = 0; index < input.length;) {
        const character = input[index];

        if (character === "{") {
            const groupStart = input.slice(index + 1).match(/^\s*(?:\\\*\s*)?\\([a-z]+)/i);
            skippedGroups.push(skipGroup);
            skipGroup = skipGroup || Boolean(groupStart && RTF_DESTINATIONS.has(groupStart[1].toLowerCase()));
            index += 1;
            continue;
        }

        if (character === "}") {
            skipGroup = skippedGroups.pop() ?? false;
            index += 1;
            continue;
        }

        if (character !== "\\") {
            if (!skipGroup) output.push(character);
            index += 1;
            continue;
        }

        if (input[index + 1] === "'") {
            const hex = input.slice(index + 2, index + 4);
            if (!skipGroup && /^[0-9a-f]{2}$/i.test(hex)) {
                output.push(new TextDecoder("windows-1252").decode(new Uint8Array([parseInt(hex, 16)])));
            }
            index += 4;
            continue;
        }

        const control = input.slice(index + 1).match(/^([a-z]+)(-?\d+)? ?/i);
        if (control) {
            const word = control[1].toLowerCase();
            if (!skipGroup) {
                if (word === "par" || word === "line") output.push("\n");
                if (word === "tab") output.push("\t");
                if (word === "u" && control[2]) {
                    const codePoint = Number(control[2]);
                    output.push(String.fromCharCode(codePoint < 0 ? codePoint + 65536 : codePoint));
                }
            }
            index += 1 + control[0].length;
            if (word === "u" && input[index] === "?") index += 1;
            continue;
        }

        const escaped = input[index + 1];
        if (!skipGroup && (escaped === "\\" || escaped === "{" || escaped === "}" || escaped === "~" || escaped === "-" || escaped === "_")) {
            output.push(escaped === "~" ? " " : escaped);
        }
        index += 2;
    }

    return output.join("").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ParamLabo = getTenantModel<IParamLabo>(context.connection, "ParamLabo");

    const { rows } = await req.json();

    if (!Array.isArray(rows)) {
        return NextResponse.json(
            { error: "Format de données invalide : le champ 'rows' doit être un tableau." },
            { status: 400 }
        );
    }

    try {
        const errors: { index: number; message: string }[] = [];

        const paramLabos = rows.map((row: unknown, i: number) => {
            const values = Array.isArray(row) ? row : [];
            const [
                Param_designation,
                PlageRefMinNe,
                PlageRefMaxNé,
                UnitéParam,
                PlageMinMaxNé,
                PlageMinEnfant,
                PlageMaxEnfant,
                PlageMinMaxEnfant,
                PLageMinFemme,
                PLageMaxFemme,
                PlageMinMaxFemme,
                PlageMinHomme,
                PlageMaxHomme,
                PlageMinMaxHomme,
                ValeurNormale,
                ValeurMinNormale,
                ValeurMaxNormale,
                TypeTexte,
            ] = values;

            const preserveText = (value: unknown) => rtfToText(value);
            const number = (value: unknown) => {
                const normalized = preserveText(value).replace(",", ".");
                if (!normalized) return undefined;
                const parsed = Number(normalized);
                return Number.isFinite(parsed) ? parsed : undefined;
            };
            const typeTexte = [true, 1, "1", "true", "oui", "yes"].includes(
                typeof TypeTexte === "string" ? TypeTexte.trim().toLowerCase() : TypeTexte as never
            );

            let rowError = "";
            if (!Array.isArray(row)) rowError += "La ligne doit être un tableau de 18 colonnes. ";
            if (values.length < 18) rowError += "La ligne doit contenir 18 colonnes. ";
            if (!preserveText(Param_designation)) rowError += "Champ 'Param_designation' manquant. ";

            if (rowError) errors.push({ index: i + 2, message: rowError.trim() });

            return {
                Param_designation: preserveText(Param_designation),
                PlageRefMinNe: number(PlageRefMinNe),
                PlageRefMaxNé: number(PlageRefMaxNé),
                UnitéParam: preserveText(UnitéParam),
                PlageMinMaxNé: preserveText(PlageMinMaxNé),
                PlageMinEnfant: number(PlageMinEnfant),
                PlageMaxEnfant: number(PlageMaxEnfant),
                PlageMinMaxEnfant: preserveText(PlageMinMaxEnfant),
                PLageMinFemme: number(PLageMinFemme),
                PLageMaxFemme: number(PLageMaxFemme),
                PlageMinMaxFemme: preserveText(PlageMinMaxFemme),
                PlageMinHomme: number(PlageMinHomme),
                PlageMaxHomme: number(PlageMaxHomme),
                PlageMinMaxHomme: preserveText(PlageMinMaxHomme),
                ValeurNormale: preserveText(ValeurNormale),
                ValeurMinNormale: number(ValeurMinNormale),
                ValeurMaxNormale: number(ValeurMaxNormale),
                TypeTexte: typeTexte,
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
