import { NextResponse } from "next/server";

import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { ParametreNfs } from "@/models/parametreNfs";
import { NfsTraitement } from "@/models/nfsTraitement";
import { LienAutomate } from "@/models/lienAutomate";


export async function POST() {

    try {

        await db();

        const automate = await LienAutomate.findOne();

        if (
            !automate?.nLienNFS
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Lien automate NFS introuvable"
                },
                {
                    status: 404
                }
            );
        }

        const controllerNfs = new AbortController();
        const timeoutNfs = setTimeout(() => controllerNfs.abort(), 8000);
        let response: Response;
        try {
            response = await fetch(automate.nLienNFS, { signal: controllerNfs.signal });
        } catch (fetchErr: any) {
            clearTimeout(timeoutNfs);
            const isTimeout = fetchErr?.name === "AbortError";
            return NextResponse.json(
                { success: false, message: isTimeout ? "Timeout : l'automate NFS ne répond pas (>8s)" : `Impossible de joindre l'automate NFS : ${fetchErr.message}` },
                { status: 503 }
            );
        }
        clearTimeout(timeoutNfs);

        const contenu = await response.text();

        if (!contenu || contenu.trim() === "") {

            return NextResponse.json({
                success: true,
                progression: 0,
                total: 0,
                message: "Aucun résultat disponible"
            });
        }

        let tableNfs: any[];
        try {
            tableNfs = JSON.parse(contenu);
        } catch {
            return NextResponse.json(
                { success: false, message: "Réponse de l'automate NFS invalide (JSON attendu)" },
                { status: 502 }
            );
        }

        const acteNfs = await ActeClinique.findOne({
            designationacte: "NUMERATION FORMULE SANGUINE (NFS)"
        });

        const familleId = acteNfs?.IDFAMILLE_ACTE_BIOLOGIE;

        const parametres = await ParametreNfs.find();

        await NfsTraitement.deleteMany({});

        let compteur = 0;

        const total = tableNfs.length;

        for (const param of parametres) {

            for (const ligne of tableNfs) {

                if (ligne.parametres !== param.PARAMETRE) {
                    continue;
                }

                const plage = String(ligne.plageRef || "");

                const morceaux = plage.split("-");

                await NfsTraitement.create({

                    Patient_Nom: ligne.nom,

                    Patient_prenom: ligne.prenom,

                    PatientP: `${ligne.nom} ${ligne.prenom}`,

                    Patient_ages: ligne.ages,

                    Patient_Sexe: ligne.sexe,

                    Patient_numDossier: ligne.numDossier,

                    NumNFs: ligne.idNfs,

                    NFS_dateAnalyse: ligne.dateAnalyse,

                    NFS_service: ligne.service,

                    NFS_idEchantillon: ligne.idEchantillon,

                    diagnostiQ: ligne.diagnostic,

                    NFS_status: ligne.status,

                    NFS_unite: ligne.unite,

                    NFS_resultat: ligne.resultat,

                    NFS_plageRef: ligne.plageRef,

                    NFS_id: ligne.id,

                    IDFAMILLE_ACTE_BIOLOGIE: familleId,

                    CodePrestation: ligne.idEchantillon,

                    ValeurMinNormale: Number(morceaux[0]) || 0,

                    ValeurMaxNormale: Number(morceaux[1]) || 0,

                    NFS_parametres: param.DESCRIPTION
                });

                compteur++;
            }
        }

        return NextResponse.json({

            success: true,

            total,

            importes:
                compteur,

            progression:
                100,

            message:
                "Import NFS terminé"
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Erreur import NFS"
            },
            {
                status: 500
            }
        );
    }
}