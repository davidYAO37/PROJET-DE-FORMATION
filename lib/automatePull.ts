import { NextRequest, NextResponse } from "next/server";
import { withTenant, getTenantFilter } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ILienAutomate } from "@/models/lienAutomate";
import { importerAutomate, FamilleAutomate } from "@/lib/automateImportService";
import { NfsImportError } from "@/lib/nfsImportService";

const LIENS = { nfs: "nLienNFS", hormones: "LienHormone", vs: "LienVS", biochimie: "LienBiochimie" } as const;
const WRITE_ROLES = ["admin", "biologiste", "technicienlabo"];

export function creerImportAutomate(famille: FamilleAutomate) {
    return async function POST(req: NextRequest) {
        const { context, response } = await withTenant(req, WRITE_ROLES, { actions: ["parametrage_actes_biologie"] });
        if (!context) return response;
        if (!context.entrepriseId) return NextResponse.json({ success: false, message: "Entreprise requise" }, { status: 403 });
        try {
            const filter = getTenantFilter(context);
            const Model = getTenantModel<ILienAutomate>(context.connection, "LienAutomate");
            const automate = await Model.findOne(filter).sort({ createdAt: -1 });
            const lien = automate?.[LIENS[famille]];
            if (!lien) return NextResponse.json({ success: false, message: `Lien automate ${famille} introuvable` }, { status: 404 });
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            let contenu: string;
            try {
                const result = await fetch(lien, { signal: controller.signal, cache: "no-store" });
                if (!result.ok) return NextResponse.json({ success: false, message: `Erreur Easy Connect ${famille} (HTTP ${result.status})` }, { status: 502 });
                contenu = await result.text();
            } catch (error) {
                return NextResponse.json({ success: false, message: (error as Error).name === "AbortError" ? `Timeout : l'automate ${famille} ne répond pas (>8s)` : `Impossible de joindre l'automate ${famille}` }, { status: 503 });
            } finally {
                clearTimeout(timeout);
            }
            let lignes: unknown = [];
            try {
                if (contenu.trim()) lignes = JSON.parse(contenu);
            } catch {
                return NextResponse.json({ success: false, message: `Réponse de l'automate ${famille} invalide (JSON attendu)` }, { status: 502 });
            }
            const bilan = await importerAutomate(context.connection, context.entrepriseId, filter, famille, lignes);
            return NextResponse.json({ success: true, ...bilan });
        } catch (error) {
            if (error instanceof NfsImportError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
            console.error(`Erreur import ${famille}:`, error);
            return NextResponse.json({ success: false, message: `Erreur import ${famille} ; une nouvelle tentative peut reprendre sans réimporter les résultats déjà reçus` }, { status: 500 });
        }
    };
}
