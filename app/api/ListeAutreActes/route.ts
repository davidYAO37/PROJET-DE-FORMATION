// app/api/ListeAutreActes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ExamenHospitalisation } from "@/models";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get("patientId");

        if (!patientId) {
            return NextResponse.json(
                { error: "L'ID du patient est requis" },
                { status: 400 }
            );
        }

        const examens = await ExamenHospitalisation.find({ IdPatient: patientId })
            .populate("IDASSURANCE", "desiganationassurance")
            .populate("IdPatient", "Nom Prenoms")
            .populate("idMedecin", "Nom prenoms")
            .sort({ DatePres: -1 })
            .lean();

        const formatted = examens.map(examen => ({
            _id: examen._id.toString(),
            designation: examen.Designationtypeacte || "Non spécifié",
            montant: examen.Montanttotal || 0,
            date: examen.DatePres ,
            statut: examen.Payeoupas || false,
            patientId: examen.IdPatient?._id?.toString(),
            codePrestation: examen.CodePrestation || "",
            designationTypeActe: examen.Designationtypeacte || "",
            Numfacture: examen.Numfacture || ""
        }));

        return NextResponse.json(formatted);

    } catch (error: any) {
        console.error("Erreur API ListeAutreActes:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des examens" },
            { status: 500 }
        );
    }
}