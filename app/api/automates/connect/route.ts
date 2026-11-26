import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Entreprise } from "@/models/entreprise";
import { getTenantConnection, getPrimaryConnection } from "@/lib/tenantDb";
import { db } from "@/db/mongoConnect";
import { importerAutomate, FamilleAutomate } from "@/lib/automateImportService";
import { NfsImportError } from "@/lib/nfsImportService";

/**
 * ENDPOINT PUSH — EASY-MEDICAL CONNECT (mode cloud).
 *
 * Les automates du laboratoire poussent leurs résultats ici via la
 * passerelle CONNECT installée sur site : pas besoin que le serveur
 * Easy Medical joigne le réseau du labo (déploiement Vercel/cloud).
 *
 *   POST /api/automates/connect
 *   Headers : x-connect-key: <Entreprise.cleConnect>
 *   Body    : { entrepriseId, famille, lignes }
 *
 * Les `lignes` suivent EXACTEMENT le contrat JSON des endpoints
 * /{famille}/data.json de CONNECT — les mêmes transformations que les
 * routes .../import sont appliquées, en UPSERT (idempotent : un push
 * retenté après une coupure ne crée pas de doublon).
 */

const FAMILLES = ["nfs", "vs", "hormones", "biochimie"] as const;

function cleValide(a: string, b: string): boolean {
    const ba = Buffer.from(String(a || ""));
    const bb = Buffer.from(String(b || ""));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
    try {
        const cle = req.headers.get("x-connect-key") || "";
        const body = await req.json();
        const { entrepriseId, famille, lignes } = body || {};
        if (!entrepriseId || !FAMILLES.includes(famille)) {
            return NextResponse.json({ message: "entrepriseId et famille (nfs|vs|hormones|biochimie) requis" }, { status: 400 });
        }
        if (!Array.isArray(lignes)) return NextResponse.json({ message: "lignes doit être un tableau" }, { status: 400 });
        await db(); // connexion primaire (Entreprise)
        const entreprise = await Entreprise.findById(entrepriseId).lean();
        if (!entreprise) return NextResponse.json({ message: "Entreprise introuvable" }, { status: 404 });
        if (!entreprise.cleConnect || !cleValide(cle, entreprise.cleConnect)) {
            return NextResponse.json({ message: "Clé CONNECT invalide" }, { status: 401 });
        }
        const connection = await getTenantConnection(String(entreprise._id));
        const filter: Record<string, string> = connection === await getPrimaryConnection() ? { entrepriseId: String(entreprise._id) } : {};
        switch (famille as FamilleAutomate) {
            // ---------- NFS ----------
            case "nfs":
            // ---------- VS ----------
            case "vs":
            // ---------- Hormones ----------
            case "hormones":
            // ---------- Biochimie ----------
            case "biochimie": {
                const bilan = await importerAutomate(connection, String(entreprise._id), filter, famille, lignes);
                return NextResponse.json({ success: true, famille, recus: lignes.length, ...bilan, ignores: [] });
            }
        }
    } catch (error) {
        if (error instanceof NfsImportError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        console.error("[connect] Erreur push :", error);
        return NextResponse.json({ message: "Erreur serveur lors de l'ingestion CONNECT" }, { status: 500 });
    }
}
