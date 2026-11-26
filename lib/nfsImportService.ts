import { createHash } from "node:crypto";
import { Connection, Types } from "mongoose";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";
import { IParametreNfs } from "@/models/parametreNfs";
import { INfsTraitement } from "@/models/nfsTraitement";

export class NfsImportError extends Error {
    constructor(message: string, public status = 422) { super(message); }
}

export async function importerNfs(connection: Connection, entrepriseId: string, filter: Record<string, string>, lignes: unknown) {
    if (!entrepriseId) throw new NfsImportError("Une entreprise est requise pour recevoir les résultats NFS", 403);
    if (!Array.isArray(lignes) || lignes.some((ligne) => !ligne || typeof ligne !== "object" || Array.isArray(ligne))) {
        throw new NfsImportError("Réponse Easy Connect NFS invalide : tableau de résultats attendu", 502);
    }
    const Nfs = getTenantModel<INfsTraitement>(connection, "NfsTraitement");
    const Parametre = getTenantModel<IParametreNfs>(connection, "ParametreNfs");
    const Acte = getTenantModel<IActeClinique>(connection, "ActeClinique");
    const normaliser = (value: unknown) => String(value ?? "").trim().toUpperCase();
    const params = await Parametre.find();
    const parCode = new Map(params.filter(p => normaliser(p.PARAMETRE) && p.DESCRIPTION).map(p => [normaliser(p.PARAMETRE), p]));
    const inconnus = [...new Set(lignes.filter(l => !parCode.has(normaliser(l.parametres))).map(l => String(l.parametres ?? "(absent)")))];
    if (inconnus.length) throw new NfsImportError(`Correspondances NFS manquantes : ${inconnus.join(", ")}. Aucun résultat importé ; historique conservé.`);
    const acte = await Acte.findOne({ designationacte: "NUMERATION FORMULE SANGUINE (NFS)" });
    const documents = lignes.map(ligne => {
        if ((typeof ligne.id !== "number" && typeof ligne.id !== "string") || String(ligne.id).trim() === "" || !Number.isSafeInteger(Number(ligne.id)) || Number(ligne.id) < 0) {
            throw new NfsImportError("Identifiant de résultat NFS absent ou invalide ; aucun résultat importé");
        }
        const param = parCode.get(normaliser(ligne.parametres))!;
        const morceaux = String(ligne.plageRef || "").split("-");
        const _id = new Types.ObjectId(createHash("sha256").update(JSON.stringify(["nfs", entrepriseId, Number(ligne.id), normaliser(ligne.parametres)])).digest("hex").slice(0, 24));
        const doc = new Nfs({
            _id, entrepriseId,
            Patient_Nom: ligne.nom, Patient_prenom: ligne.prenom,
            PatientP: `${ligne.nom || ""} ${ligne.prenom || ""}`.trim(),
            Patient_ages: ligne.ages, Patient_Sexe: ligne.sexe,
            Patient_numDossier: ligne.numDossier, NumNFs: ligne.idNfs,
            NFS_dateAnalyse: ligne.dateAnalyse, NFS_service: ligne.service,
            NFS_idEchantillon: ligne.idEchantillon, diagnostiQ: ligne.diagnostic,
            NFS_status: ligne.status, NFS_unite: ligne.unite,
            NFS_resultat: ligne.resultat, NFS_plageRef: ligne.plageRef,
            NFS_id: Number(ligne.id), NFS_parametres: param.DESCRIPTION,
            IDFAMILLE_ACTE_BIOLOGIE: acte?.IDFAMILLE_ACTE_BIOLOGIE,
            CodePrestation: ligne.idEchantillon,
            ValeurMinNormale: Number(morceaux[0]) || 0,
            ValeurMaxNormale: Number(morceaux[1]) || 0,
        });
        const error = doc.validateSync();
        if (error) throw new NfsImportError("Résultat NFS invalide (date, type ou longueur de champ) ; aucun résultat importé");
        return doc;
    });
    let importes = 0;
    let dejaImportes = 0;
    for (const doc of documents) {
        const legacy = await Nfs.exists({ ...filter, NFS_id: doc.NFS_id, NFS_parametres: doc.NFS_parametres });
        if (legacy) { dejaImportes++; continue; }
        try {
            const result = await Nfs.updateOne({ _id: doc._id, entrepriseId }, { $setOnInsert: doc.toObject() }, { upsert: true, runValidators: true });
            if (result.upsertedCount) importes++;
            else dejaImportes++;
        } catch (error) {
            if ((error as { code?: number }).code !== 11000 || !await Nfs.exists({ _id: doc._id, entrepriseId })) throw error;
            dejaImportes++;
        }
    }
    return { total: lignes.length, importes, dejaImportes, progression: lignes.length ? 100 : 0,
        message: lignes.length ? `NFS : ${importes} nouveau(x) résultat(s), ${dejaImportes} déjà reçu(s). Historique conservé.` : "Aucun résultat NFS disponible ; historique conservé" };
}
