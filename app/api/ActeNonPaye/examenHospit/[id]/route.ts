import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await db();

    try {
        const id = params.id;

        console.log("ID reçu par l'API:", id);
        console.log("Type:", typeof id);
        console.log(
            "ObjectId valide ?",
            mongoose.Types.ObjectId.isValid(id)
        );

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "ID d'examen invalide" },
                { status: 400 }
            );
        }

        const examen = await ExamenHospitalisation.findByIdAndUpdate(
            id,
            {
                statutPrescriptionMedecin: 1,
                updatedAt: new Date(),
            },
            { new: true }
        );

        if (!examen) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Examen d'hospitalisation non trouvé avec l'ID: ${id}`,
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: examen._id,
                statutPrescriptionMedecin: examen.statutPrescriptionMedecin,
            },
        });

    } catch (error) {
        console.error("Erreur API examenHospit:", error);
        return NextResponse.json(
            { success: false, message: "Erreur serveur" },
            { status: 500 }
        );
    }
}
