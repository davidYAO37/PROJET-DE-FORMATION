import { NextResponse } from "next/server";

import { db } from "@/db/mongoConnect";
import { BiochimieTraitement } from "@/models/BiochimieTraitement";
import { LienAutomate } from "@/models/lienAutomate";
import { ParamBiochimie } from "@/models/paramBiochimie";

export async function POST() {

    try {
        await db();
        const automate = await LienAutomate.findOne();

        if (!automate?.LienBiochimie) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Lien automate Biochimie introuvable"
                },
                {
                    status: 404
                }
            );
        }

        const controllerBio = new AbortController();
        const timeoutBio = setTimeout(() => controllerBio.abort(), 8000);
        let response: Response;
        try {
            response = await fetch(automate.LienBiochimie, { signal: controllerBio.signal });
        } catch (fetchErr: any) {
            clearTimeout(timeoutBio);
            const isTimeout = fetchErr?.name === "AbortError";
            return NextResponse.json(
                { success: false, message: isTimeout ? "Timeout : l'automate Biochimie ne répond pas (>8s)" : `Impossible de joindre l'automate Biochimie : ${fetchErr.message}` },
                { status: 503 }
            );
        }
        clearTimeout(timeoutBio);

        const contenu = await response.text();

        if (!contenu || contenu.trim() === "") {

            return NextResponse.json({
                success: true,
                progression: 0,
                total: 0,
                message: "Aucun résultat Biochimie disponible"
            });
        }

        let data: any[];
        try {
            data = JSON.parse(contenu);
        } catch {
            return NextResponse.json(
                { success: false, message: "Réponse de l'automate Biochimie invalide (JSON attendu)" },
                { status: 502 }
            );
        }

        const params = await ParamBiochimie.find();

        await BiochimieTraitement.deleteMany({});

        let compteur = 0;

        const total = data.length;

        for (const ligne of data) {

            const mapping = params.find(
                p => p.CodeB?.toUpperCase() === String(
                    ligne.chim || ""
                ).toUpperCase()
            );

            await BiochimieTraitement.create({

                type_echantillon: ligne.type_echantillon,
                cdbar: ligne.cdbar,
                service: ligne.service,
                Sexe: ligne.sexe,
                Age_partient: Number(ligne.ages) || 0,
                date_analyse: ligne.date_analyse,
                Diagnostic: ligne.diagnostic,
                id_patient: ligne.idPatient,
                date_naissance: ligne.date_naissance,
                IDMEDECIN: ligne.medecins,
                chim: mapping?.LibelleB || ligne.chim,
                resultat: String(ligne.resultat),
                unite: ligne.unite,
                marque: ligne.marque,
                plage: ligne.plage,
                id_biochimie: ligne.idBiochimie,
                CodePrestation: ligne.idEchantillon
            });

            compteur++;
        }

        return NextResponse.json({

            success: true,

            progression: 100,

            total,

            importes: compteur,

            message: "Biochimie actualisée avec succès"
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erreur import Biochimie"
            },
            {
                status: 500
            }
        );
    }
}