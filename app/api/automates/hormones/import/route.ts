import { NextResponse } from "next/server";

import { db } from "@/db/mongoConnect";
import { LienAutomate } from "@/models/lienAutomate";
import { FamilleActe } from "@/models/familleActe";
import { HormoneTraitement } from "@/models/HormoneTraitement";

export async function POST() {

    try {

        await db();

        const automate =
            await LienAutomate
                .findOne()
                .sort({
                    createdAt: -1
                });

        if (
            !automate?.LienHormone
        ) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Lien automate Hormone introuvable"
                },
                {
                    status: 404
                }
            );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        let response: Response;
        try {
            response = await fetch(automate.LienHormone, { signal: controller.signal });
        } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            const isTimeout = fetchErr?.name === "AbortError";
            return NextResponse.json(
                {
                    success: false,
                    message: isTimeout
                        ? "Timeout : l'automate Hormones ne répond pas (>8s)"
                        : `Impossible de joindre l'automate Hormones : ${fetchErr.message}`
                },
                { status: 503 }
            );
        }
        clearTimeout(timeoutId);

        const contenu = await response.text();

        if (!contenu || contenu.trim() === "") {

            return NextResponse.json({
                success: true,
                progression: 0,
                total: 0,
                message: "Aucun résultat Hormone disponible"
            });
        }

        let hormones: any[];
        try {
            hormones = JSON.parse(contenu);
        } catch {
            return NextResponse.json(
                { success: false, message: "Réponse de l'automate Hormones invalide (JSON attendu)" },
                { status: 502 }
            );
        }

        const famille = await FamilleActe.findOne({
            Description: "HORMONES"
        });

        await HormoneTraitement.deleteMany({});

        let compteur = 0;

        const total = hormones.length;

        for (const item of hormones) {

            const plage = String(item.Plage || "");

            const morceaux = plage.split("-");

            let dateHormone = null;

            if (item.DateHormone) {

                dateHormone = new Date(item.DateHormone);
            }

            await HormoneTraitement.create({

                status: item.Status,

                dateHormone,

                id: item.Id,

                numPatient: item.NumPatient,

                article: String(item.Article || "").toUpperCase(),

                echantillon: item.Echantillon,

                resultathor: item.Resultat,

                unitehorm: item.Unite,

                plagehormone: item.Plage,

                IDFAMILLE_ACTE_BIOLOGIE: famille?._id,

                CodePrestation: item.NumPatient,

                ValeurMinNormale: Number(morceaux[0]) || 0,

                ValeurMaxNormale: Number(morceaux[1]) || 0,

                DejaUtilise: false
            });

            compteur++;
        }

        return NextResponse.json({

            success: true,

            total,

            importes: compteur,

            progression: 100,

            message: "Hormones actualisées avec succès"
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erreur import Hormones"
            },
            {
                status: 500
            }
        );
    }
}