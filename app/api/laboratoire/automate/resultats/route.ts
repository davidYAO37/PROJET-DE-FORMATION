import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { NfsTraitement } from "@/models/nfsTraitement";
import { VitesseTraitement } from "@/models/VitesseTraitement";
import { BiochimieTraitement } from "@/models/BiochimieTraitement";
import { ActeParamBiochimie } from "@/models/acteParamBiochimie";
import { ActeParamLabo } from "@/models/acteParamLabo";
import { LignePrestation } from "@/models/lignePrestation";
import { HonoraireTraitement } from "@/models/HormoneTraitement";

export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { lignePrestationId, prestation, idActe, idHospitalisation, age, sexe } = body;

        const parametres: any[] = [];

        // 1. Vérifier NFS (NUMERATION FORMULE SANGUINE)
        if (prestation === "NUMERATION FORMULE SANGUINE (NFS)") {
            const nfsTraitements = await NfsTraitement.find({
                $or: [
                    { CodePrestation: prestation },
                    { CodePrestation: idHospitalisation }
                ]
            }).lean();

            for (const nfs of nfsTraitements) {
                parametres.push({
                    IDACTEP: idActe,
                    Param_designation: nfs.NFS_parametres,
                    ChampResultat: nfs.NFS_resultat,
                    ValeurNormale: nfs.NFS_plageRef,
                    ValeurMaxNormale: nfs.ValeurMaxNormale,
                    ValeurMinNormale: nfs.ValeurMinNormale,
                    IDLIGNE_PRESTATION: lignePrestationId,
                    IDFAMILLE_ACTE_BIOLOGIE: nfs.IDFAMILLE_ACTE_BIOLOGIE,
                    unite: nfs.NFS_unite,
                    TypeTexte: false,
                    ORdonnacementAffichage: 0
                });
            }
        }

        // 2. Vérifier VITESSE DE SEDIMENTATION
        if (prestation === "VITESSE DE SEDIMENTATION") {
            const vitesseTraitements = await VitesseTraitement.find({
                $or: [
                    { CodePrestation: prestation },
                    { CodePrestation: idHospitalisation }
                ]
            }).lean();

            for (const vitesse of vitesseTraitements) {
                parametres.push({
                    IDACTEP: idActe,
                    Param_designation: vitesse.parametres,
                    ChampResultat: vitesse.resultat,
                    ValeurNormale: `${vitesse.ValeurMinNormale}-${vitesse.ValeurMaxNormale}`,
                    ValeurMaxNormale: vitesse.ValeurMaxNormale,
                    ValeurMinNormale: vitesse.ValeurMinNormale,
                    IDLIGNE_PRESTATION: lignePrestationId,
                    IDFAMILLE_ACTE_BIOLOGIE: vitesse.IDFAMILLE_ACTE_BIOLOGIE,
                    unite: vitesse.unite,
                    TypeTexte: false,
                    ORdonnacementAffichage: 0
                });
            }
        }

        // 3. RESULTAT_HORMONES
        if (parametres.length === 0) {
            const hormoneTraitements = await HonoraireTraitement.find({
                $or: [
                    { CodePrestation: prestation },
                    { CodePrestation: idHospitalisation }
                ]
            }).lean();

            for (const hormone of hormoneTraitements) {
                let paramDesignation = hormone.article;
                let shouldAdd = false;

                if (prestation === "PSA TOTALE" && hormone.article === "PSA") {
                    shouldAdd = true;
                }
                if ((prestation === "PSA LIBRE" || prestation === "PSA libre") && hormone.article === "F-PSA") {
                    shouldAdd = true;
                    // Ajouter le ratio
                    parametres.push({
                        IDACTEP: idActe,
                        Param_designation: "Ration PSAL/PSAT :",
                        ChampResultat: "0",
                        ValeurNormale: "0",
                        ValeurMaxNormale: 0,
                        ValeurMinNormale: 0,
                        IDLIGNE_PRESTATION: lignePrestationId,
                        IDFAMILLE_ACTE_BIOLOGIE: hormone.IDFAMILLE_ACTE_BIOLOGIE,
                        unite: "%",
                        TypeTexte: false,
                        ORdonnacementAffichage: 0
                    });
                }
                if (prestation === "BETA - HCG" && hormone.article === "??-HCG") {
                    paramDesignation = "BETA - HCG";
                    shouldAdd = true;
                }
                if (prestation === "TESTOSTERONE" && hormone.article === "TESTO") {
                    paramDesignation = "TESTOSTERONE";
                    shouldAdd = true;
                }
                if ((prestation === "TSH ULTRASENSIBLE" || prestation === "TSH") && hormone.article === "TSH") {
                    shouldAdd = true;
                }
                if (prestation === "FSH" && hormone.article === "FSH") {
                    shouldAdd = true;
                }
                if (prestation === "ALPHA FOETO PROTEINE" && hormone.article === "AFP") {
                    shouldAdd = true;
                }
                if (prestation === "LH" && hormone.article === "LH") {
                    shouldAdd = true;
                }
                if (prestation === "PROLACTINE" && hormone.article === "PLR") {
                    shouldAdd = true;
                }
                if (prestation === "HEMOGLOBINE GLYQUEE" && hormone.article === "HBA1C") {
                    shouldAdd = true;
                }

                if (shouldAdd) {
                    parametres.push({
                        IDACTEP: idActe,
                        Param_designation: paramDesignation,
                        ChampResultat: hormone.resultathor,
                        ValeurNormale: hormone.plagehormone,
                        ValeurMaxNormale: hormone.ValeurMaxNormale,
                        ValeurMinNormale: hormone.ValeurMinNormale,
                        IDLIGNE_PRESTATION: lignePrestationId,
                        IDFAMILLE_ACTE_BIOLOGIE: hormone.IDFAMILLE_ACTE_BIOLOGIE,
                        unite: hormone.unitehorm,
                        TypeTexte: false,
                        ORdonnacementAffichage: 0
                    });
                }
            }
        }

        // 4. RESULTAT_BIOCHIMIE
        if (parametres.length === 0) {
            const acteParamsBiochimie = await ActeParamBiochimie.find({
                IDACTEP: idActe
            }).lean();

            for (const acteParam of acteParamsBiochimie) {
                const biochimieTraitements = await BiochimieTraitement.find({
                    $or: [
                        { id_patient: prestation },
                        { id_patient: idHospitalisation }
                    ]
                }).lean();

                for (const biochimie of biochimieTraitements) {
                    if (acteParam.param_designb === biochimie.chim) {
                        parametres.push({
                            IDACTEP: idActe,
                            Param_designation: prestation,
                            ChampResultat: biochimie.resultat,
                            ValeurNormale: "",
                            ValeurMaxNormale: null,
                            ValeurMinNormale: null,
                            IDLIGNE_PRESTATION: lignePrestationId,
                            IDFAMILLE_ACTE_BIOLOGIE: undefined,
                            unite: biochimie.unite,
                            TypeTexte: false,
                            ORdonnacementAffichage: 0
                        });

                        // Ajouter Cholestérol T/HDL pour CHOLESTÉROL TOTAL
                        if (acteParam.param_designb === "CHOLESTÉROL TOTAL") {
                            parametres.push({
                                IDACTEP: idActe,
                                Param_designation: "Cholestérol T/HDL :",
                                ChampResultat: "",
                                ValeurNormale: "",
                                ValeurMaxNormale: null,
                                ValeurMinNormale: null,
                                IDLIGNE_PRESTATION: lignePrestationId,
                                IDFAMILLE_ACTE_BIOLOGIE: undefined,
                                unite: biochimie.unite,
                                TypeTexte: false,
                                ORdonnacementAffichage: 0
                            });
                        }
                        break;
                    }
                }
            }
        }

        // 5. RECHERCHE_UNITE - Mettre à jour les valeurs normales selon âge et sexe
        if (parametres.length > 0) {
            const acteParamsLabo = await ActeParamLabo.find({
                IDACTEP: idActe
            }).lean();

            for (const param of parametres) {
                const acteParam = acteParamsLabo.find(ap => ap.Param_designation === param.Param_designation);
                if (acteParam) {
                    let valeurNormale = "";
                    let valeurMinimale = 0;
                    let valeurMaximale = 0;

                    // Nouveau-né
                    if (age && age < 1) {
                        valeurNormale = acteParam.PlageMinMaxNé || "";
                        valeurMinimale = acteParam.PlageRefMinNe || 0;
                        valeurMaximale = acteParam.PlageRefMaxNé || 0;
                    }
                    // Enfant (1-15 ans)
                    else if (age && age >= 1 && age < 16) {
                        valeurNormale = acteParam.PlageMinMaxEnfant || "";
                        valeurMinimale = acteParam.PlageMinEnfant || 0;
                        valeurMaximale = acteParam.PlageMaxEnfant || 0;
                    }
                    // Adulte (>15 ans)
                    else if (age && age > 15) {
                        if (sexe === "F") {
                            valeurNormale = acteParam.PlageMinMaxFemme || "";
                            valeurMinimale = acteParam.PLageMinFemme || 0;
                            valeurMaximale = acteParam.PlageMaxFemme || 0;
                        } else {
                            valeurNormale = acteParam.PlageMinMaxHomme || "";
                            valeurMinimale = acteParam.PlageMinHomme || 0;
                            valeurMaximale = acteParam.PlageMaxHomme || 0;
                        }
                    }

                    // Valeur par défaut si min et max sont 0
                    if (valeurMinimale === 0 && valeurMaximale === 0) {
                        valeurNormale = acteParam.ValeurNormale || "";
                        valeurMinimale = acteParam.ValeurMinNormale || 0;
                        valeurMaximale = acteParam.ValeurMaxNormale || 0;
                    }

                    param.ValeurNormale = valeurNormale;
                    param.ValeurMaxNormale = valeurMaximale;
                    param.ValeurMinNormale = valeurMinimale;
                    param.unite = acteParam.UnitéParam || param.unite;
                }
            }
        }

        if (parametres.length === 0) {
            return NextResponse.json({
                success: false,
                message: "Aucun paramètre automate trouvé pour cette prestation",
                parametres
            });
        }

        return NextResponse.json({
            success: true,
            parametres
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Erreur serveur lors du chargement des résultats Automate" },
            { status: 500 }
        );
    }
}
