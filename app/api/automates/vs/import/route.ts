import { NextResponse } from "next/server";

import { db } from "@/db/mongoConnect";
import { VitesseTraitement } from "@/models/VitesseTraitement";
import { LienAutomate } from "@/models/lienAutomate";
import { ActeClinique } from "@/models/acteclinique";

export async function POST() {

    try {
        await db();
        const automate = await LienAutomate.findOne().sort({ createdAt: -1 });
        if (!automate?.LienVS) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Lien automate VS introuvable"
                },
                {
                    status: 404
                }
            );
        }
        const controllerVs = new AbortController();
        const timeoutVs = setTimeout(() => controllerVs.abort(), 8000);
        let response: Response;
        try {
            response = await fetch(automate.LienVS, { signal: controllerVs.signal });
        } catch (fetchErr: any) {
            clearTimeout(timeoutVs);
            const isTimeout = fetchErr?.name === "AbortError";
            return NextResponse.json(
                { success: false, message: isTimeout ? "Timeout : l'automate VS ne répond pas (>8s)" : `Impossible de joindre l'automate VS : ${fetchErr.message}` },
                { status: 503 }
            );
        }
        clearTimeout(timeoutVs);

        const contenu = await response.text();
        if (!contenu || contenu.trim() === "") {
            return NextResponse.json({
                success: true,
                progression: 0,
                total: 0,
                message: "Aucun résultat VS disponible"
            });
        }

        let tableVs: any[];
        try {
            tableVs = JSON.parse(contenu);
        } catch {
            return NextResponse.json(
                { success: false, message: "Réponse de l'automate VS invalide (JSON attendu)" },
                { status: 502 }
            );
        }

        const acteVs =
            await ActeClinique.findOne({
                designationacte:
                    "VITESSE DE SEDIMENTATION"
            });

        const familleId =
            acteVs?.IDFAMILLE_ACTE_BIOLOGIE;

        await VitesseTraitement.deleteMany({});

        let compteur = 0;

        const total = tableVs.length;

        for (const ligne of tableVs) {

            const resultat = String(ligne.resultat || "");

            const resultatNet = resultat.split("\\")[0];

            let parametre = "";

            if (ligne.parametres === "Vs(18°)") {

                parametre = "1ERE HEURE";
            }

            if (ligne.parametres === "KATZ") {

                parametre = "2EME HEURE";
            }

            if (!parametre) {
                continue;
            }

            let dateVitesse = null;

            if (ligne.dateVitesse) {

                dateVitesse = new Date(ligne.dateVitesse);
            }

            await VitesseTraitement.create({

                parametres: parametre,

                resultat: resultatNet,

                id: ligne.id,

                unite: ligne.unite,

                dateVitesse,

                CodePrestation: ligne.numDossier,

                IDFAMILLE_ACTE_BIOLOGIE: familleId,

                DejaUtilise: false
            });

            compteur++;
        }

        return NextResponse.json({

            success: true,

            total,

            importes: compteur,

            progression: 100,

            message: "VS actualisée avec succès"
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erreur import VS"
            },
            {
                status: 500
            }
        );
    }
}