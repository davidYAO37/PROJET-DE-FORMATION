import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { Medecin } from "@/models/medecin";
import { Patient } from "@/models/patient";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();

    try {
        // Récupérer toutes les consultations avec demande d'annulation
        const consultations = await Consultation.find({ Ordonnerlannulation: 1 })
            .populate({
                path: 'IdPatient',
                select: 'Nom Prenoms',
                model: 'Patient'
            })
            .populate({
                path: 'IDMEDECIN',
                select: 'nom prenoms',
                model: 'Medecin'
            })
            .sort({ AnnulationOrdonneLe: -1 })
            .lean();

        const result = consultations.map((c: any) => ({
            _id: c._id,
            CodePrestation: c.CodePrestation,
            Date_consulation: c.Date_consulation,
            PatientP: c.PatientP || (c.IdPatient ? `${c.IdPatient?.Nom || ''} ${c.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
            designationC: c.designationC || "Consultation",
            Prix_Assurance: c.Prix_Assurance,
            StatutC: c.StatutC,
            Ordonnerlannulation: c.Ordonnerlannulation,
            AnnulOrdonnerPar: c.AnnulOrdonnerPar,
            AnnulationOrdonneLe: c.AnnulationOrdonneLe,
            SaisiPar: c.SaisiPar
        }));

        return NextResponse.json(result);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("Erreur lors du chargement des consultations avec annulation:", error);
        return NextResponse.json(
            {
                error: "Une erreur est survenue lors du chargement des consultations",
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            },
            { status: 500 }
        );
    }
}