import { NextRequest, NextResponse } from "next/server";
import { withTenant, getTenantFilter } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const ROLES = ["admin", "adminsuper", "biologiste", "technicienlabo"];
const LIMIT = 500;

const COLLECTIONS = {
    nfs: { model: "NfsTraitement", select: "PatientP Patient_numDossier NumNFs NFS_dateAnalyse NFS_service NFS_parametres NFS_resultat NFS_unite NFS_status createdAt" },
    hormones: { model: "HormoneTraitement", select: "numPatient article echantillon resultathor unitehorm plagehormone dateHormone status createdAt" },
    vs: { model: "VitesseTraitement", select: "CodePrestation parametres resultat unite dateVitesse createdAt" },
    biochimie: { model: "BiochimieTraitement", select: "CodePrestation service chim resultat unite plage date_analyse id_patient createdAt" },
} as const;

type HistoriqueType = keyof typeof COLLECTIONS;

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    try {
        const filter = getTenantFilter(context);
        const resultat: Record<string, unknown> = {};

        for (const [key, cfg] of Object.entries(COLLECTIONS)) {
            const Model = getTenantModel(context.connection, cfg.model);
            const [total, items] = await Promise.all([
                Model.countDocuments(filter),
                Model.find(filter).sort({ createdAt: -1 }).limit(LIMIT).select(cfg.select).lean(),
            ]);
            resultat[key] = { total, limite: LIMIT, data: items };
        }

        return NextResponse.json({ success: true, ...resultat });
    } catch (error) {
        console.error("Erreur GET historique automates:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES, { actions: ["parametrage_actes_biologie"] });
    if (!context) return response;
    try {
        const type = (req.nextUrl.searchParams.get("type") || "all") as HistoriqueType | "all";
        const filter = getTenantFilter(context);

        if (type === "all") {
            let supprimes = 0;
            for (const cfg of Object.values(COLLECTIONS)) {
                const Model = getTenantModel(context.connection, cfg.model);
                supprimes += (await Model.deleteMany(filter)).deletedCount || 0;
            }
            return NextResponse.json({ success: true, supprimes, message: "Historique de tous les automates vidé" });
        }

        const cfg = COLLECTIONS[type];
        if (!cfg) return NextResponse.json({ message: "Type d'historique invalide" }, { status: 400 });
        const Model = getTenantModel(context.connection, cfg.model);
        const result = await Model.deleteMany(filter);
        return NextResponse.json({ success: true, supprimes: result.deletedCount, message: `Historique ${type} vidé` });
    } catch (error) {
        console.error("Erreur DELETE historique automates:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}
