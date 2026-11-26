import { createHash } from "node:crypto";
import { Connection, Types } from "mongoose";
import { getTenantModel } from "@/lib/tenantModels";
import { importerNfs, NfsImportError } from "@/lib/nfsImportService";
import { IParamBiochimie } from "@/models/paramBiochimie";
import { IActeClinique } from "@/models/acteclinique";
import { IFamilleActe } from "@/models/familleActe";

export type FamilleAutomate = "nfs" | "hormones" | "vs" | "biochimie";

const CONFIG = {
    hormones: { model: "HormoneTraitement", id: "id", parametre: "article", titre: "Hormones" },
    vs: { model: "VitesseTraitement", id: "id", parametre: "parametres", titre: "VS" },
    biochimie: { model: "BiochimieTraitement", id: "id_biochimie", parametre: "chim", titre: "Biochimie" },
} as const;

const normaliser = (value: string) => value.trim().toUpperCase();

function identifiant(value: unknown): string {
    if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "" || (typeof value === "number" && (!Number.isSafeInteger(value) || value < 0))) {
        throw new NfsImportError("Identifiant de résultat absent ou invalide ; aucun résultat importé");
    }
    return String(value).trim();
}

function parametre(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) throw new NfsImportError("Code paramètre absent ou invalide ; aucun résultat importé");
    return normaliser(value);
}

function verifierDate(value: unknown) {
    if (value === undefined || value === null || value === "") return;
    if (typeof value !== "string" || !Number.isFinite(new Date(value).getTime())) {
        throw new NfsImportError("Date de résultat invalide ; aucun résultat importé");
    }
}

export async function importerAutomate(connection: Connection, entrepriseId: string, filter: Record<string, string>, famille: FamilleAutomate, lignes: unknown) {
    if (famille === "nfs") return importerNfs(connection, entrepriseId, filter, lignes);
    if (!entrepriseId) throw new NfsImportError("Une entreprise est requise pour recevoir les résultats", 403);
    if (!Array.isArray(lignes) || lignes.some(ligne => !ligne || typeof ligne !== "object" || Array.isArray(ligne))) {
        throw new NfsImportError("Réponse Easy Connect invalide : tableau de résultats attendu", 502);
    }
    const cfg = CONFIG[famille];
    const Model = getTenantModel(connection, cfg.model);
    const params = famille === "biochimie" ? await getTenantModel<IParamBiochimie>(connection, "ParamBiochimie").find() : [];
    const familleHormones = famille === "hormones" ? await getTenantModel<IFamilleActe>(connection, "FamilleActe").findOne({ Description: "HORMONES" }) : null;
    const acteVs = famille === "vs" ? await getTenantModel<IActeClinique>(connection, "ActeClinique").findOne({ designationacte: "VITESSE DE SEDIMENTATION" }) : null;
    const documents = (lignes as Record<string, unknown>[]).map(ligne => {
        const id = identifiant(famille === "hormones" ? ligne.Id : famille === "biochimie" ? ligne.idBiochimie ?? ligne.id : ligne.id);
        if (famille === "biochimie" && ligne.idBiochimie !== undefined && ligne.id !== undefined && identifiant(ligne.id) !== id) {
            throw new NfsImportError("Identifiants biochimie id/idBiochimie contradictoires ; aucun résultat importé");
        }
        const code = parametre(famille === "hormones" ? ligne.Article : famille === "vs" ? ligne.parametres : ligne.chim);
        const resultat = famille === "hormones" ? ligne.Resultat : ligne.resultat;
        if ((typeof resultat !== "string" && typeof resultat !== "number") || (typeof resultat === "string" && !resultat.trim()) || (typeof resultat === "number" && !Number.isFinite(resultat))) {
            throw new NfsImportError("Valeur de résultat absente ou invalide ; aucun résultat importé");
        }
        verifierDate(famille === "hormones" ? ligne.DateHormone : famille === "vs" ? ligne.dateVitesse : ligne.date_analyse);
        const _id = new Types.ObjectId(createHash("sha256").update(JSON.stringify([famille, entrepriseId, id, code])).digest("hex").slice(0, 24));
        let fields: Record<string, unknown>;
        if (famille === "hormones") {
            const morceaux = String(ligne.Plage || "").split("-");
            fields = {
                status: ligne.Status, dateHormone: ligne.DateHormone || null, id,
                numPatient: ligne.NumPatient, article: code, echantillon: ligne.Echantillon,
                resultathor: String(resultat), unitehorm: ligne.Unite, plagehormone: ligne.Plage,
                IDFAMILLE_ACTE_BIOLOGIE: familleHormones?._id, CodePrestation: ligne.NumPatient,
                ValeurMinNormale: Number(morceaux[0]) || 0, ValeurMaxNormale: Number(morceaux[1]) || 0,
                DejaUtilise: false,
            };
        } else if (famille === "vs") {
            const designation = code === "VS(18°)" ? "1ERE HEURE" : code === "KATZ" ? "2EME HEURE" : "";
            if (!designation) throw new NfsImportError(`Paramètre VS non reconnu : ${code}. Aucun résultat importé ; historique conservé.`);
            fields = {
                parametres: designation, resultat: String(resultat).split("\\")[0], id,
                unite: ligne.unite, dateVitesse: ligne.dateVitesse || null, CodePrestation: ligne.numDossier,
                IDFAMILLE_ACTE_BIOLOGIE: acteVs?.IDFAMILLE_ACTE_BIOLOGIE, DejaUtilise: false,
            };
        } else {
            verifierDate(ligne.date_naissance);
            const mapping = params.find(p => p.CodeB && normaliser(p.CodeB) === code);
            fields = {
                type_echantillon: ligne.type_echantillon, cdbar: ligne.cdbar, service: ligne.service,
                Sexe: ligne.sexe, Age_partient: Number(ligne.ages) || 0,
                date_analyse: ligne.date_analyse, Diagnostic: ligne.diagnostic,
                id_patient: ligne.idPatient, date_naissance: ligne.date_naissance || null,
                IDMEDECIN: ligne.medecins, chim: mapping?.LibelleB || code,
                resultat: String(resultat), unite: ligne.unite, marque: ligne.marque, plage: ligne.plage,
                id_biochimie: id, CodePrestation: ligne.idEchantillon,
            };
        }
        const doc = new Model({ _id, entrepriseId, ...fields });
        if (doc.validateSync()) throw new NfsImportError(`Résultat ${cfg.titre} invalide ; aucun résultat importé`);
        return { doc, legacy: { ...filter, [cfg.id]: id, [cfg.parametre]: fields[cfg.parametre] } };
    });
    let importes = 0;
    let dejaImportes = 0;
    for (const { doc, legacy } of documents) {
        if (await Model.exists(legacy)) { dejaImportes++; continue; }
        try {
            const result = await Model.updateOne({ _id: doc._id, entrepriseId }, { $setOnInsert: doc.toObject() }, { upsert: true, runValidators: true });
            if (result.upsertedCount) importes++;
            else dejaImportes++;
        } catch (error) {
            if ((error as { code?: number }).code !== 11000 || !await Model.exists({ _id: doc._id, entrepriseId })) throw error;
            dejaImportes++;
        }
    }
    return { total: lignes.length, importes, dejaImportes, progression: lignes.length ? 100 : 0,
        message: lignes.length ? `${cfg.titre} : ${importes} nouveau(x) résultat(s), ${dejaImportes} déjà reçu(s). Historique conservé.` : `Aucun résultat ${cfg.titre} disponible ; historique conservé` };
}
