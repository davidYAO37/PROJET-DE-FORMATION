import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    try {
        await db();
        const { id } = await params;


        const examen = await ExamenHospitalisation

            .findById(id)
            .populate("IdPatient")
            .lean();

        if (!examen) {
            return NextResponse.json(
                { message: "Examen introuvable" },
                { status: 404 }
            );
        }

        return NextResponse.json(examen);

    } catch (error) {

        console.error("Erreur lors de la recherche de l'examen:", error);

        return NextResponse.json(
            { message: "Erreur serveur" },
            { status: 500 }
        );
    }
}