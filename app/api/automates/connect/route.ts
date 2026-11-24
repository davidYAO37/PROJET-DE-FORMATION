import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Entreprise } from "@/models/entreprise";
import { getTenantConnection } from "@/lib/tenantDb";
import { getTenantModel } from "@/lib/tenantModels";
import { db } from "@/db/mongoConnect";
import { IActeClinique } from "@/models/acteclinique";
import { IParametreNfs } from "@/models/parametreNfs";
import { INfsTraitement } from "@/models/nfsTraitement";
import { IVitesseTraitement } from "@/models/VitesseTraitement";
import { IHormoneTraitement } from "@/models/HormoneTraitement";
import { IBiochimieTraitement } from "@/models/BiochimieTraitement";
import { IParamBiochimie } from "@/models/paramBiochimie";
import { IFamilleActe } from "@/models/familleActe";

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
type Famille = (typeof FAMILLES)[number];

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
            return NextResponse.json(
                { message: "entrepriseId et famille (nfs|vs|hormones|biochimie) requis" },
                { status: 400 }
            );
        }
        if (!Array.isArray(lignes)) {
            return NextResponse.json({ message: "lignes doit être un tableau" }, { status: 400 });
        }

        await db(); // connexion primaire (Entreprise)
        const entreprise = await Entreprise.findById(entrepriseId).lean();
        if (!entreprise) {
            return NextResponse.json({ message: "Entreprise introuvable" }, { status: 404 });
        }
        if (!entreprise.cleConnect || !cleValide(cle, entreprise.cleConnect)) {
            return NextResponse.json({ message: "Clé CONNECT invalide" }, { status: 401 });
        }

        const connection = await getTenantConnection(entrepriseId);
        const NfsTraitement = getTenantModel<INfsTraitement>(connection, "NfsTraitement");
        const VitesseTraitement = getTenantModel<IVitesseTraitement>(connection, "VitesseTraitement");
        const HormoneTraitement = getTenantModel<IHormoneTraitement>(connection, "HormoneTraitement");
        const BiochimieTraitement = getTenantModel<IBiochimieTraitement>(connection, "BiochimieTraitement");
        const ActeClinique = getTenantModel<IActeClinique>(connection, "ActeClinique");
        const ParametreNfs = getTenantModel<IParametreNfs>(connection, "ParametreNfs");
        const ParamBiochimie = getTenantModel<IParamBiochimie>(connection, "ParamBiochimie");
        const FamilleActe = getTenantModel<IFamilleActe>(connection, "FamilleActe");

        let importes = 0;
        const ignores: string[] = [];

        // ---------- NFS ----------
        if (famille === "nfs") {
            const acte = await ActeClinique.findOne({ designationacte: "NUMERATION FORMULE SANGUINE (NFS)" });
            const params = await ParametreNfs.find();
            const parCode = new Map(params.map((p: any) => [p.PARAMETRE, p]));

            for (const ligne of lignes) {
                const param = parCode.get(ligne.parametres);
                if (!param) { ignores.push(String(ligne.parametres)); continue; }
                const morceaux = String(ligne.plageRef || "").split("-");
                const doc = {
                    Patient_Nom: ligne.nom,
                    Patient_prenom: ligne.prenom,
                    PatientP: `${ligne.nom || ""} ${ligne.prenom || ""}`.trim(),
                    Patient_ages: ligne.ages,
                    Patient_Sexe: ligne.sexe,
                    Patient_numDossier: ligne.numDossier,
                    NumNFs: ligne.idNfs,
                    NFS_dateAnalyse: ligne.dateAnalyse ? new Date(ligne.dateAnalyse) : null,
                    NFS_service: ligne.service,
                    NFS_idEchantillon: ligne.idEchantillon,
                    diagnostiQ: ligne.diagnostic,
                    NFS_status: ligne.status,
                    NFS_unite: ligne.unite,
                    NFS_resultat: ligne.resultat,
                    NFS_plageRef: ligne.plageRef,
                    NFS_id: ligne.id,
                    IDFAMILLE_ACTE_BIOLOGIE: acte?.IDFAMILLE_ACTE_BIOLOGIE,
                    CodePrestation: ligne.idEchantillon,
                    ValeurMinNormale: Number(morceaux[0]) || 0,
                    ValeurMaxNormale: Number(morceaux[1]) || 0,
                    NFS_parametres: param.DESCRIPTION,
                };
                await NfsTraitement.findOneAndUpdate(
                    { NFS_id: ligne.id, NFS_parametres: param.DESCRIPTION },
                    doc,
                    { upsert: true }
                );
                importes++;
            }
        }

        // ---------- VS ----------
        if (famille === "vs") {
            const acte = await ActeClinique.findOne({ designationacte: "VITESSE DE SEDIMENTATION" });
            for (const ligne of lignes) {
                const parametre =
                    ligne.parametres === "Vs(18°)" ? "1ERE HEURE" :
                    ligne.parametres === "KATZ" ? "2EME HEURE" : "";
                if (!parametre) { ignores.push(String(ligne.parametres)); continue; }
                const doc = {
                    parametres: parametre,
                    resultat: String(ligne.resultat || "").split("\\")[0],
                    id: ligne.id,
                    unite: ligne.unite,
                    dateVitesse: ligne.dateVitesse ? new Date(ligne.dateVitesse) : null,
                    CodePrestation: ligne.numDossier,
                    IDFAMILLE_ACTE_BIOLOGIE: acte?.IDFAMILLE_ACTE_BIOLOGIE,
                    DejaUtilise: false,
                };
                await VitesseTraitement.findOneAndUpdate(
                    { id: ligne.id, parametres: parametre },
                    doc,
                    { upsert: true }
                );
                importes++;
            }
        }

        // ---------- Hormones ----------
        if (famille === "hormones") {
            const f = await FamilleActe.findOne({ Description: "HORMONES" });
            for (const item of lignes) {
                const morceaux = String(item.Plage || "").split("-");
                const doc = {
                    status: item.Status,
                    dateHormone: item.DateHormone ? new Date(item.DateHormone) : null,
                    id: item.Id,
                    numPatient: item.NumPatient,
                    article: String(item.Article || "").toUpperCase(),
                    echantillon: item.Echantillon,
                    resultathor: item.Resultat,
                    unitehorm: item.Unite,
                    plagehormone: item.Plage,
                    IDFAMILLE_ACTE_BIOLOGIE: f?._id,
                    CodePrestation: item.NumPatient,
                    ValeurMinNormale: Number(morceaux[0]) || 0,
                    ValeurMaxNormale: Number(morceaux[1]) || 0,
                    DejaUtilise: false,
                };
                await HormoneTraitement.findOneAndUpdate(
                    { id: item.Id, article: doc.article },
                    doc,
                    { upsert: true }
                );
                importes++;
            }
        }

        // ---------- Biochimie ----------
        if (famille === "biochimie") {
            const params = await ParamBiochimie.find();
            for (const ligne of lignes) {
                const mapping = params.find(
                    (p: any) => p.CodeB?.toUpperCase() === String(ligne.chim || "").toUpperCase()
                );
                const doc = {
                    type_echantillon: ligne.type_echantillon,
                    cdbar: ligne.cdbar,
                    service: ligne.service,
                    Sexe: ligne.sexe,
                    Age_partient: Number(ligne.ages) || 0,
                    date_analyse: ligne.date_analyse ? new Date(ligne.date_analyse) : null,
                    Diagnostic: ligne.diagnostic,
                    id_patient: ligne.idPatient,
                    date_naissance: ligne.date_naissance,
                    IDMEDECIN: ligne.medecins,
                    chim: mapping?.LibelleB || ligne.chim,
                    resultat: String(ligne.resultat),
                    unite: ligne.unite,
                    marque: ligne.marque,
                    plage: ligne.plage,
                    id_biochimie: ligne.id,
                    CodePrestation: ligne.idEchantillon,
                };
                await BiochimieTraitement.findOneAndUpdate(
                    { id_biochimie: ligne.id, chim: doc.chim },
                    doc,
                    { upsert: true }
                );
                importes++;
            }
        }

        return NextResponse.json({
            success: true,
            famille,
            recus: lignes.length,
            importes,
            ignores: [...new Set(ignores)],
        });
    } catch (error) {
        console.error("[connect] Erreur push :", error);
        return NextResponse.json(
            { message: "Erreur serveur lors de l'ingestion CONNECT" },
            { status: 500 }
        );
    }
}
