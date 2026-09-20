import { IActeClinique } from "@/models/acteclinique";
import { IAssurance } from "@/models/assurance";
import { ISocieteAssurance } from "@/models/SocieteAssurance";
import { ITarifAssurance } from "@/models/tarifassurance";
import { ITarifSocieteAssurance } from "@/models/tarifsocieteassurance";
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable"];
const WRITE_ROLES = ["admin"];

// GET /api/tarifs-societe-assurance?societeAssuranceId=...&assuranceId=...
export async function GET(req: NextRequest) {
    try {
        const { context, response } = await withTenant(req, READ_ROLES);
        if (!context) return response;

        const { searchParams } = new URL(req.url);
        const societeAssuranceId = searchParams.get("societeAssuranceId");
        const assuranceId = searchParams.get("assuranceId");

        if (!societeAssuranceId) {
            return NextResponse.json({ error: "societeAssuranceId requis" }, { status: 400 });
        }

        const TarifSocieteAssurance = getTenantModel<ITarifSocieteAssurance>(context.connection, "TarifSocieteAssurance");
        const SocieteAssurance = getTenantModel<ISocieteAssurance>(context.connection, "SocieteAssurance");
        const TarifAssurance = getTenantModel<ITarifAssurance>(context.connection, "TarifAssurance");
        const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");

        const societe = await SocieteAssurance.findById(societeAssuranceId).lean();
        if (!societe) {
            return NextResponse.json({ error: "Société d'assurance introuvable" }, { status: 404 });
        }

        const parentAssuranceId = (societe.Assurance as any)?.toString?.() || societe.Assurance?.toString?.() || assuranceId;
        if (!parentAssuranceId) {
            return NextResponse.json({ error: "Assurance parente introuvable" }, { status: 400 });
        }

        // Si la société n'utilise pas ses propres tarifs, renvoyer ceux de l'assurance
        if (societe.utiliseTarifsPropres === false) {
            const tarifsAssurance = await TarifAssurance.find({ assurance: parentAssuranceId }).lean();
            return NextResponse.json(tarifsAssurance);
        }

        let tarifs = await TarifSocieteAssurance.find({ societeAssurance: societeAssuranceId }).lean();

        // Initialiser les tarifs société à partir des tarifs assurance si vides
        if (tarifs.length === 0) {
            const [tarifsAssurance, actes] = await Promise.all([
                TarifAssurance.find({ assurance: parentAssuranceId }).lean(),
                ActeClinique.find().lean(),
            ]);

            const tarifsAssuranceMap = new Map(tarifsAssurance.map((t: any) => [t.acteId?.toString?.(), t]));
            const nouveauxTarifs = actes
                .filter((acte: any) => !tarifs.some((t: any) => t.acteId?.toString?.() === acte._id.toString()))
                .map((acte: any) => {
                    const parent = tarifsAssuranceMap.get(acte._id.toString());
                    return {
                        acte: acte.designationacte,
                        lettreCle: acte.lettreCle ?? "",
                        coefficient: acte.coefficient ?? 0,
                        prixmutuel: parent?.prixmutuel ?? acte.prixMutuel ?? 0,
                        prixpreferenciel: parent?.prixpreferenciel ?? acte.prixPreferentiel ?? 0,
                        societeAssurance: societeAssuranceId,
                        assurance: parentAssuranceId,
                        acteId: acte._id,
                    };
                });

            if (nouveauxTarifs.length > 0) {
                await TarifSocieteAssurance.insertMany(nouveauxTarifs, { ordered: false }).catch((err) => {
                    if (err.code !== 11000) throw err;
                });
                tarifs = await TarifSocieteAssurance.find({ societeAssurance: societeAssuranceId }).lean();
            }
        }

        return NextResponse.json(tarifs);
    } catch (error: any) {
        console.error("Erreur GET /tarifs-societe-assurance :", error);
        return NextResponse.json({ error: "Impossible de récupérer les tarifs" }, { status: 500 });
    }
}

// PUT /api/tarifs-societe-assurance
export async function PUT(req: NextRequest) {
    try {
        const { context, response } = await withTenant(req, WRITE_ROLES);
        if (!context) return response;
        const TarifSocieteAssurance = getTenantModel<ITarifSocieteAssurance>(context.connection, "TarifSocieteAssurance");
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: "Format invalide, tableau attendu" }, { status: 400 });
        }

        await Promise.all(
            body.map((t: any) => {
                if (!t._id) return;
                return TarifSocieteAssurance.findByIdAndUpdate(t._id, {
                    prixmutuel: t.prixmutuel,
                    prixpreferenciel: t.prixpreferenciel,
                    coefficient: t.coefficient,
                });
            })
        );

        return NextResponse.json({ message: "Tarifs société mis à jour ✅" });
    } catch (error: any) {
        console.error("Erreur PUT /tarifs-societe-assurance :", error);
        return NextResponse.json({ error: "Impossible de mettre à jour les tarifs" }, { status: 500 });
    }
}
