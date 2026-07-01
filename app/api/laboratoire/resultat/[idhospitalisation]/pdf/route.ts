import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation, LignePrestation, Patient } from "@/models";
import { ResultatLignePrestation } from "@/models/resultatLignePrestation";
import { Entreprise } from "@/models/entreprise";
import { FamilleActe } from "@/models/familleActe";
import { genererResultatBiologique, DonneesPdf, EntreprisePdf } from "@/lib/pdf/ResultatBiologique";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ idhospitalisation: string }> }
) {
    try {
        await db();

        const { idhospitalisation: idHospitalisation } = await params;
        const searchParams = req.nextUrl.searchParams;
        const avecEntete = searchParams.get("avecEntete") !== "false";
        const orientationParam = searchParams.get("orientation");
        const orientation: "portrait" | "landscape" = orientationParam === "landscape" ? "landscape" : "portrait";

        const examen = await ExamenHospitalisation
            .findById(idHospitalisation)
            .lean();

        if (!examen) {
            return NextResponse.json(
                { success: false, message: "Examen introuvable" },
                { status: 404 }
            );
        }

        const patient = examen.IdPatient
            ? await Patient.findById(examen.IdPatient).lean()
            : null;

        const lignes = await LignePrestation
            .find({ idHospitalisation })
            .sort({ idFamilleActeBiologie: 1, typeResultat: -1, ordonnancementAffichage: 1 })
            .lean();

        // Récupérer toutes les descriptions de familles en une fois
        const familleIdsSet = new Set<string>();
        for (const ligne of lignes) {
            if (ligne.idFamilleActeBiologie) {
                familleIdsSet.add(String(ligne.idFamilleActeBiologie));
            }
        }
        const famillesDb = await FamilleActe.find({
            _id: { $in: Array.from(familleIdsSet) }
        }).lean();
        const familleDescMap = new Map<string, string>();
        for (const f of famillesDb) {
            familleDescMap.set(String(f._id), f.Description || "");
        }

        const lignesPdf = [];
        for (const ligne of lignes) {
            const resultats = await ResultatLignePrestation
                .find({ IDLIGNE_PRESTATION: ligne._id })
                .sort({ IDFAMILLE_ACTE_BIOLOGIE: 1, ORdonnacementAffichage: 1 })
                .lean();

            if (resultats.length === 0) continue;

            const familleId = String(resultats[0].IDFAMILLE_ACTE_BIOLOGIE || ligne.idFamilleActeBiologie || "");
            const familleDescription = familleDescMap.get(familleId) || familleDescMap.get(String(ligne.idFamilleActeBiologie || "")) || "";

            lignesPdf.push({
                prestation: ligne.prestation || "",
                familleDescription,
                typeResultat: ligne.typeResultat || 0,
                ordre: ligne.ordonnancementAffichage || 0,
                observation: ligne.observationExamen || "",
                familleId,
                resultats: resultats.map((resultat) => ({
                    Param_designation: resultat.Param_designation || "",
                    ChampResultat: resultat.ChampResultat || "",
                    ValeurNormale: resultat.ValeurNormale || "",
                    PlageMin: resultat.ValeurMinNormale,
                    PlageMax: resultat.ValeurMaxNormale,
                    unite: resultat.unite || "",
                    interpretation: resultat.Interpretation || ""
                }))
            });
        }

        let entreprisePdf: EntreprisePdf | undefined = undefined;
        const entrepriseId = examen.entrepriseId;
        const entreprise = entrepriseId
            ? await Entreprise.findOne({ _id: entrepriseId }).lean()
            : await Entreprise.findOne().lean();

        if (entreprise) {
            entreprisePdf = {
                NomSociete: entreprise.NomSociete,
                EnteteSociete: entreprise.EnteteSociete,
                LogoE: entreprise.LogoE,
                PiedPageSociete: entreprise.PiedPageSociete
            };
        }

        const data: DonneesPdf = {
            patient: {
                Nom: patient?.Nom || "",
                Prenoms: patient?.Prenoms || "",
                Sexe: patient?.sexe || "",
                Age_partient: patient?.Age_partient || 0,
                Code_dossier: patient?.Code_dossier || ""
            },
            examen: {
                _id: String(examen._id),
                CodePrestation: examen.CodePrestation || "",
                NomMed: examen.NomMed || "",
                CONCLUSIONGENE: examen.CONCLUSIONGENE || "",
                Rclinique: typeof examen.Rclinique === 'string' ? examen.Rclinique : "",
                ObservationC: examen.ObservationC || "",
                ProvenanceExamen: examen.ProvenanceExamen || "",
                NIdentificationExamen: examen.NIdentificationExamen || "",
                Assurance: examen.Assurance || "",
                DatePres: examen.DatePres || new Date(),
                DATERECEPTIONNER: examen.DATERECEPTIONNER,
                DateValidation: examen.DateValidation,
                Heurereception: examen.Heurereception,
                Biologiste: examen.Biologiste || "",
                CachetBiologiste: examen.CachetBiologiste as Buffer | undefined
            },
            lignes: lignesPdf,
            entreprise: entreprisePdf,
            options: {
                afficherEntete: avecEntete,
                orientation
            }
        };

        const pdfBuffer = await genererResultatBiologique(data);

        const fileName = `resultat-${examen.CodePrestation || idHospitalisation}.pdf`;

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${fileName}"`
            }
        });
    } catch (error) {
        console.error("Erreur génération PDF résultat biologique:", error);
        return NextResponse.json(
            { success: false, message: "Erreur serveur lors de la génération du PDF" },
            { status: 500 }
        );
    }
}
