import { NextRequest, NextResponse } from "next/server";
import { Patient } from "@/models/patient";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get("patientId");
        const statut = searchParams.get("statut"); // Optionnel: filtrer par statut

        let query: any = {};
        if (patientId) {
            query.patientId = patientId;
        }
        if (statut) {
            query.statut = statut === 'true';
        }

        const examens = await ExamenHospitalisation.find(query)
            .populate("patientId", "Nom Prenoms Code_dossier")
            .sort({ date: -1 }); // Plus récent en premier

        return NextResponse.json(examens);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    try {
        const body = await req.json();
        
        // Validation des champs obligatoires
        if (!body.designation || !body.patientId || !body.montant) {
            return NextResponse.json(
                { error: "Les champs designation, patientId et montant sont obligatoires" },
                { status: 400 }
            );
        }

        // Vérifier si le patient existe
        const patient = await Patient.findById(body.patientId);
        if (!patient) {
            return NextResponse.json(
                { error: "Patient non trouvé" },
                { status: 404 }
            );
        }

        // Créer un nouvel examen d'hospitalisation
        const nouvelExamen = new ExamenHospitalisation({
            designation: body.designation,
            montant: body.montant,
            date: body.date || new Date(),
            statut: body.statut || false, // Par défaut non validé
            patientId: body.patientId,
            codePrestation: body.codePrestation || "",
            designationTypeActe: body.designationTypeActe || "",
            observations: body.observations || "",
            createdBy: body.createdBy || "system"
        });

        const examenSauvegarde = await nouvelExamen.save();
        
        // Mettre à jour le patient avec la référence vers l'examen
        await Patient.findByIdAndUpdate(
            body.patientId,
            { $push: { examensHospit: examenSauvegarde._id } },
            { new: true }
        );

        return NextResponse.json(examenSauvegarde, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: `Erreur lors de la création de l'examen: ${error.message}` },
            { status: 500 }
        );
    }
}
