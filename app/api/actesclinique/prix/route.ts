import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";
import { ITarifAssurance } from "@/models/tarifassurance";
import { ITarifSocieteAssurance } from "@/models/tarifsocieteassurance";

// Rôles qui facturent les actes (caisse, accueil). Seuls les prix peuvent être modifiés ici,
// contrairement aux routes de paramétrage (/api/actes/[id], /api/tarifs/[id]) réservées à l'admin.
const ROLES = ["admin", "caisse", "accueil"];

type Champ = "clinique" | "mutualiste" | "preferentiel";

const CHAMPS_ACTE: Record<Champ, string> = {
    clinique: "prixClinique",
    mutualiste: "prixMutuel",
    preferentiel: "prixPreferentiel",
};
const CHAMPS_TARIF: Record<Exclude<Champ, "clinique">, string> = {
    mutualiste: "prixmutuel",
    preferentiel: "prixpreferenciel",
};

const estId = (v: unknown): v is string => typeof v === "string" && mongoose.Types.ObjectId.isValid(v);

/**
 * PATCH /api/actesclinique/prix
 * Body :
 *  - { cible: "acte",  acteId, champ: "clinique" | "mutualiste" | "preferentiel", prix }
 *  - { cible: "tarif", tarifId, champ: "mutualiste" | "preferentiel", prix }
 *  - { cible: "tarif", acteId, assuranceId, societeAssuranceId?, champ, prix }  -> crée le tarif s'il est absent
 */
export async function PATCH(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");
    const TarifAssurance = getTenantModel<ITarifAssurance>(context.connection, "TarifAssurance");
    const TarifSocieteAssurance = getTenantModel<ITarifSocieteAssurance>(context.connection, "TarifSocieteAssurance");
    const SocieteAssurance = getTenantModel<any>(context.connection, "SocieteAssurance");

    try {
        const body = await req.json();
        const prix = Number(body?.prix);
        const champ = body?.champ as Champ;
        if (!Number.isInteger(prix) || prix <= 0) {
            return NextResponse.json({ error: "Le prix doit être un nombre entier supérieur à 0" }, { status: 400 });
        }

        // ----- Prix de l'acte (catalogue clinique) -----
        if (body?.cible === "acte") {
            if (!estId(body.acteId) || !CHAMPS_ACTE[champ]) {
                return NextResponse.json({ error: "Acte ou champ de prix invalide" }, { status: 400 });
            }
            const acte = await ActeClinique.findByIdAndUpdate(
                body.acteId,
                { $set: { [CHAMPS_ACTE[champ]]: prix } },
                { new: true, projection: { _id: 1, designationacte: 1, prixClinique: 1, prixMutuel: 1, prixPreferentiel: 1 } }
            ).lean();
            if (!acte) return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
            return NextResponse.json({ cible: "acte", acte });
        }

        if (body?.cible !== "tarif" || !CHAMPS_TARIF[champ as Exclude<Champ, "clinique">]) {
            return NextResponse.json({ error: "Cible ou champ de prix invalide" }, { status: 400 });
        }
        const champTarif = CHAMPS_TARIF[champ as Exclude<Champ, "clinique">];

        // ----- Tarif existant (société ou assurance) -----
        if (estId(body.tarifId)) {
            const maj = { $set: { [champTarif]: prix } };
            const tarifSociete = await TarifSocieteAssurance.findByIdAndUpdate(body.tarifId, maj, { new: true }).lean();
            if (tarifSociete) return NextResponse.json({ cible: "tarif", source: "societe", tarif: tarifSociete });
            const tarifAssurance = await TarifAssurance.findByIdAndUpdate(body.tarifId, maj, { new: true }).lean();
            if (tarifAssurance) return NextResponse.json({ cible: "tarif", source: "assurance", tarif: tarifAssurance });
            return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
        }

        // ----- Tarif absent : création pour la société (si elle a ses propres tarifs) ou l'assurance -----
        if (!estId(body.acteId)) {
            return NextResponse.json({ error: "Acte requis pour créer le tarif" }, { status: 400 });
        }
        const acte = await ActeClinique.findById(body.acteId).lean<any>();
        if (!acte) return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });

        // Valeurs initiales du tarif créé ; le prix saisi est appliqué par $set (pas de conflit de chemin)
        const base: Record<string, any> = {
            acte: acte.designationacte,
            lettreCle: acte.lettreCle ?? "",
            coefficient: acte.coefficient ?? 0,
            prixmutuel: acte.prixMutuel ?? 0,
            prixpreferenciel: acte.prixPreferentiel ?? 0,
            // acteId, assurance et societeAssurance viennent du filtre de l'upsert
        };
        delete base[champTarif];

        if (estId(body.societeAssuranceId)) {
            const societe = await SocieteAssurance.findById(body.societeAssuranceId).lean<any>();
            if (!societe) return NextResponse.json({ error: "Société d'assurance introuvable" }, { status: 404 });
            const assuranceParente = String(societe.Assurance || body.assuranceId || "");
            if (societe.utiliseTarifsPropres !== false) {
                if (!estId(assuranceParente)) return NextResponse.json({ error: "Assurance parente introuvable" }, { status: 400 });
                const tarif = await TarifSocieteAssurance.findOneAndUpdate(
                    { societeAssurance: body.societeAssuranceId, acteId: acte._id },
                    { $set: { [champTarif]: prix }, $setOnInsert: { ...base, assurance: assuranceParente } },
                    { new: true, upsert: true }
                ).lean();
                return NextResponse.json({ cible: "tarif", source: "societe", tarif, cree: true });
            }
            body.assuranceId = assuranceParente;
        }

        if (!estId(body.assuranceId)) {
            return NextResponse.json({ error: "Assurance requise pour créer le tarif" }, { status: 400 });
        }
        const tarif = await TarifAssurance.findOneAndUpdate(
            { assurance: body.assuranceId, acteId: acte._id },
            { $set: { [champTarif]: prix }, $setOnInsert: { ...base } },
            { new: true, upsert: true }
        ).lean();
        return NextResponse.json({ cible: "tarif", source: "assurance", tarif, cree: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
