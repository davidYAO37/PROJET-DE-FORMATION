import { NextRequest, NextResponse } from "next/server";
import { withTenant, getTenantFilter } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ILienAutomate } from "@/models/lienAutomate";
import { importerNfs, NfsImportError } from "@/lib/nfsImportService";

const WRITE_ROLES = ["admin", "biologiste", "technicienlabo"];

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES, { actions: ["parametrage_actes_biologie"] });
    if (!context) return response;
    if (!context.entrepriseId) return NextResponse.json({ success: false, message: "Entreprise requise" }, { status: 403 });
    try {
        const filter = getTenantFilter(context);
        const LienAutomate = getTenantModel<ILienAutomate>(context.connection, "LienAutomate");
        const automate = await LienAutomate.findOne(filter).sort({ createdAt: -1 });
        if (!automate?.nLienNFS) {
            return NextResponse.json({ success: false, message: "Lien automate NFS introuvable" }, { status: 404 });
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let contenu: string;
        try {
            const result = await fetch(automate.nLienNFS, { signal: controller.signal, cache: "no-store" });
            if (!result.ok) return NextResponse.json({ success: false, message: `Erreur Easy Connect NFS (HTTP ${result.status})` }, { status: 502 });
            contenu = await result.text();
        } catch (error) {
            return NextResponse.json({ success: false, message: (error as Error).name === "AbortError" ? "Timeout : l'automate NFS ne répond pas (>8s)" : "Impossible de joindre l'automate NFS" }, { status: 503 });
        } finally {
            clearTimeout(timeout);
        }
        let lignes: unknown = [];
        try {
            if (contenu.trim()) lignes = JSON.parse(contenu);
        } catch {
            return NextResponse.json({ success: false, message: "Réponse de l'automate NFS invalide (JSON attendu)" }, { status: 502 });
        }
        const bilan = await importerNfs(context.connection, context.entrepriseId, filter, lignes);
        return NextResponse.json({ success: true, ...bilan });
    } catch (error) {
        if (error instanceof NfsImportError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        console.error("Erreur import NFS:", error);
        return NextResponse.json({ success: false, message: "Erreur import NFS ; une nouvelle tentative peut reprendre sans réimporter les résultats déjà reçus" }, { status: 500 });
    }
}
