import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";

export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "Paramètres manquants", message: "startDate et endDate sont requis." },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const receptions = await ExamenHospitalisation.find({
            Designationtypeacte: 'EXAMEN BIOLOGIQUE',
            StatutLaboratoire: { $in: [1, null] },
            statutPrescriptionMedecin: { $gt: 1 },
            DatePres: {
                $gte: start,
                $lte: end,
            },
        }).lean();

        return NextResponse.json(receptions);
    } catch (error) {
        console.error("Erreur GET examens reception:", error);
        return NextResponse.json(
            { error: "Erreur serveur", message: String(error) },
            { status: 500 }
        );
    }
}
