import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";
import { ActeParamLabo } from "@/models/acteParamLabo";
import { ResultatLignePrestation } from "@/models/resultatLignePrestation";


export async function GET(req: NextRequest, { params }: { params: Promise<{ lignePrestationId: string }> }) {

    try {
        await db();
        const { lignePrestationId } = await params;

        const { searchParams } = new URL(req.url);
        const age = searchParams.get('age');
        const sexe = searchParams.get('sexe');

        const ligne = await LignePrestation.findById(lignePrestationId);

        if (!ligne) {

            return NextResponse.json(
                {
                    message: "Prestation introuvable"
                },
                {
                    status: 404
                }
            );
        }

        const actesParam = await ActeParamLabo.find({
            IDACTEP: ligne.idActe
        })
            .sort({
                ORdonnacementAffichage: 1
            });

        const resultats = await ResultatLignePrestation.find({
            IDLIGNE_PRESTATION: ligne._id
        });

        // Récupérer l'interprétation commune de la prestation (premier résultat avec interprétation)
        const interpretationCommune = resultats.find(r => r.Interpretation)?.Interpretation || ligne.observationExamen || "";

        const data = actesParam.map(
            (param) => {

                const resultat = resultats.find((r) =>
                    String(r.Param_designation) === String(param.Param_designation)
                );

                // Sélectionner les valeurs normales selon l'âge et le sexe
                let valeurNormale = param.ValeurNormale;
                let valeurMinNormale = param.ValeurMinNormale;
                let valeurMaxNormale = param.ValeurMaxNormale;

                const ageNum = age ? parseFloat(age) : 0;

                // Nouveau-né (âge < 1)
                if (ageNum < 1) {
                    valeurNormale = param.PlageMinMaxNé || param.ValeurNormale;
                    valeurMinNormale = param.PlageRefMinNe || param.ValeurMinNormale;
                    valeurMaxNormale = param.PlageRefMaxNé || param.ValeurMaxNormale;
                }
                // Enfant (âge >= 1 et < 16)
                else if (ageNum >= 1 && ageNum < 16) {
                    valeurNormale = param.PlageMinMaxEnfant || param.ValeurNormale;
                    valeurMinNormale = param.PlageMinEnfant || param.ValeurMinNormale;
                    valeurMaxNormale = param.PlageMaxEnfant || param.ValeurMaxNormale;
                }
                // Adulte (âge > 15)
                else if (ageNum > 15) {
                    if (sexe === "F") {
                        valeurNormale = param.PlageMinMaxFemme || param.ValeurNormale;
                        valeurMinNormale = param.PLageMinFemme || param.ValeurMinNormale;
                        valeurMaxNormale = param.PlageMaxFemme || param.ValeurMaxNormale;
                    } else {
                        valeurNormale = param.PlageMinMaxHomme || param.ValeurNormale;
                        valeurMinNormale = param.PlageMinHomme || param.ValeurMinNormale;
                        valeurMaxNormale = param.PlageMaxHomme || param.ValeurMaxNormale;
                    }
                }

                // Si min=0 et max=0, utiliser les valeurs par défaut
                if (valeurMinNormale === 0 && valeurMaxNormale === 0) {
                    valeurNormale = param.ValeurNormale;
                    valeurMinNormale = param.ValeurMinNormale;
                    valeurMaxNormale = param.ValeurMaxNormale;
                }

                return {
                    _id: resultat?._id,
                    IDACTEP: param.IDACTEP,
                    Param_designation: param.Param_designation,
                    ChampResultat: resultat?.ChampResultat || "",
                    ValeurNormale: valeurNormale,
                    ValeurMaxNormale: valeurMaxNormale,
                    ValeurMinNormale: valeurMinNormale,
                    IDLIGNE_PRESTATION: ligne._id,
                    IDResultat: resultat?._id || "",
                    IDFAMILLE_ACTE_BIOLOGIE: ligne.idFamilleActeBiologie,
                    TypeTexte: param.TypeTexte,
                    ORdonnacementAffichage: param.ORdonnacementAffichage,
                    UnitéParam: param.UnitéParam,
                    Interpretation: interpretationCommune
                };
            }
        );

        return NextResponse.json(data);

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Erreur serveur"
            },
            {
                status: 500
            }
        );
    }
}