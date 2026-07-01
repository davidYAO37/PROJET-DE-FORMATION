import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation, LignePrestation, Patient } from "@/models";
import { ResultatLignePrestation } from "@/models/resultatLignePrestation";


export async function GET(req: NextRequest, { params }: { params: Promise<{ idhospitalisation: string }> }) {

    try {

        await db();

        const { idhospitalisation: idHospitalisation } = await params;

        const examen = await ExamenHospitalisation
            .findById(idHospitalisation)
            .lean();

        if (!examen) {

            return NextResponse.json(
                {
                    success: false,
                    message: "Examen introuvable"
                },
                {
                    status: 404
                }
            );
        }

        const patient = examen.IdPatient
            ? await Patient.findById(examen.IdPatient).lean()
            : null;

        const lignes = await LignePrestation
            .find({ idHospitalisation })
            .sort({ idFamilleActeBiologie: 1, typeResultat: 1, ordonnancementAffichage: 1 })
            .lean();
        const resultat = [];
        for (const ligne of lignes) {
            const paramsResultat = await ResultatLignePrestation
                .find({ IDLIGNE_PRESTATION: ligne._id })
                .sort({ ORdonnacementAffichage: 1 })
                .lean();
            resultat.push({
                prestation: ligne,
                resultats: paramsResultat
            });
        }
        return NextResponse.json({ success: true, examen, patient, lignes: resultat });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                success: false,
                message: "Erreur serveur"
            },
            {
                status: 500
            }
        );
    }
}