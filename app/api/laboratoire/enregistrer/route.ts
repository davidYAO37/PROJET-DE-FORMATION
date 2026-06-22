import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";
import { ResultatLignePrestation } from "@/models/resultatLignePrestation";
import { ExamenHospitalisation } from "@/models/examenHospit";

interface ParametreResultat {
    _id?: string;
    IDACTEP?: string;
    Param_designation?: string;
    ChampResultat?: string;
    ValeurNormale?: string;
    ValeurMaxNormale?: number;
    ValeurMinNormale?: number;
    IDLIGNE_PRESTATION?: string;
    IDResultat?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: string;
    TypeTexte?: boolean;
    ORdonnacementAffichage?: number;
    UnitéParam?: string;
}

export async function POST(req: NextRequest) {
    try {
        await db();

        const body = await req.json();

        const {
            idHospitalisation,
            lignePrestationId,
            conclusionGenerale,
            interpretation,
            provenance,
            identificationExamen,
            externeInterne,
            medecinId,
            medecinNom,
            resultatSaisiePar,
            parametres
        } = body;

        if (
            !idHospitalisation ||
            !lignePrestationId ||
            !parametres ||
            !Array.isArray(parametres)
        ) {
            return NextResponse.json(
                {
                    message:
                        "idHospitalisation, lignePrestationId et parametres sont requis"
                },
                { status: 400 }
            );
        }

        const ligne = await LignePrestation.findById(
            lignePrestationId
        );

        if (!ligne) {
            return NextResponse.json(
                {
                    message:
                        "Ligne de prestation introuvable"
                },
                { status: 404 }
            );
        }

        const examen = await ExamenHospitalisation.findById(
            idHospitalisation
        );

        if (!examen) {
            return NextResponse.json(
                {
                    message:
                        "Examen d'hospitalisation introuvable"
                },
                { status: 404 }
            );
        }

        const examenUpdate: any = {};
        if (conclusionGenerale !== undefined) {
            examenUpdate.CONCLUSIONGENE = conclusionGenerale;
        }
        if (provenance !== undefined) {
            examenUpdate.ProvenanceExamen = provenance;
        }
        if (identificationExamen !== undefined) {
            examenUpdate.NIdentificationExamen = identificationExamen;
        }
        if (externeInterne !== undefined) {
            examenUpdate.Externe_Interne = externeInterne;
        }
        if (medecinId && medecinId.trim() !== "") {
            examenUpdate.idMedecin = medecinId;
        }
        if (resultatSaisiePar) {
            examenUpdate.resultatSaisiePar = resultatSaisiePar;
        }
        examenUpdate.dateSaisieResultat = new Date();

        const updatedExamen =
            Object.keys(examenUpdate).length > 0
                ? await ExamenHospitalisation.findByIdAndUpdate(
                    examen._id,
                    examenUpdate,
                    {
                        new: true,
                        runValidators: true
                    }
                )
                : examen;
       
        const ligneUpdate: any = {
            observationExamen: interpretation ?? ligne.observationExamen,
            resultatSaisiePar: resultatSaisiePar ?? ligne.resultatSaisiePar,
            dateSaisieResultat: new Date(),
            provenanceExamen: provenance ?? ligne.provenanceExamen,
            nIdentificationExamen: identificationExamen ?? ligne.nIdentificationExamen,
            externeInterne: externeInterne ?? ligne.externeInterne
        };

        if (medecinId) {
            ligneUpdate.idMedecin = medecinId;
        }

        const updatedLigne = await LignePrestation.findByIdAndUpdate(
            lignePrestationId,
            ligneUpdate,
            {
                new: true,
                runValidators: true
            }
        );

        const savedResults = [];

        for (const param of parametres as ParametreResultat[]) {
            const resultData: any = {
                Param_designation: param.Param_designation,
                ChampResultat: param.ChampResultat || "",
                ValeurNormale: param.ValeurNormale,
                ValeurMaxNormale: param.ValeurMaxNormale,
                ValeurMinNormale: param.ValeurMinNormale,
                IDLIGNE_PRESTATION: lignePrestationId,
                IDACTEP: param.IDACTEP,
                IDFAMILLE_ACTE_BIOLOGIE: param.IDFAMILLE_ACTE_BIOLOGIE,
                TypeTexte: param.TypeTexte,
                ORdonnacementAffichage: param.ORdonnacementAffichage,
                unite: param.UnitéParam,
                Interpretation: interpretation,
                ProvenanceExamen: provenance,
                Externe_Interne: externeInterne,
                NIdentificationExamen: identificationExamen,
                idHospitalisation: idHospitalisation,
                resultatSaisiePar: resultatSaisiePar,
                dateSaisieResultat: new Date()
            };

            if (param.IDResultat) {
                const updatedResult =
                    await ResultatLignePrestation.findByIdAndUpdate(
                        param.IDResultat,
                        resultData,
                        {
                            new: true,
                            runValidators: true
                        }
                    );

                if (updatedResult) {
                    savedResults.push(updatedResult);
                    continue;
                }
            }

            const existingResult =
                await ResultatLignePrestation.findOne({
                    IDLIGNE_PRESTATION: lignePrestationId,
                    Param_designation: param.Param_designation
                });

            if (existingResult) {
                const updatedResult =
                    await ResultatLignePrestation.findByIdAndUpdate(
                        existingResult._id,
                        resultData,
                        {
                            new: true,
                            runValidators: true
                        }
                    );

                if (updatedResult) {
                    savedResults.push(updatedResult);
                    continue;
                }
            }

            const createdResult = await ResultatLignePrestation.create(resultData);
            savedResults.push(createdResult);
        }

        return NextResponse.json({
            success: true,
            message: "Résultats enregistrés avec succès",
            examen: updatedExamen,
            ligne: updatedLigne,
            resultats: savedResults
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Erreur serveur lors de l'enregistrement"
            },
            { status: 500 }
        );
    }
}
