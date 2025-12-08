import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { Patient } from "@/models/patient";      // ✅ Pour populate IdPatient
import { Medecin } from "@/models/medecin";      // ✅ Pour populate idMedecin

export async function GET(req: NextRequest) {
    await db();

    try {
        const { searchParams } = new URL(req.url);
        const statut = searchParams.get('statut');

        // Filtre initial : non payé et statut 2 (non facturé)
        const filter: any = {
            Payeoupas: false,
            statutPrescriptionMedecin: 2 // Statut 2 = non facturé
        };

        // Si un statut spécifique est fourni dans la requête
        if (statut) {
            filter.statutPrescriptionMedecin = parseInt(statut);
        }

        const prestations = await ExamenHospitalisation.find(filter)
            .populate({
                path: 'IdPatient',
                select: 'Nom Prenoms',
                model: 'Patient'
            })
            .populate({
                path: 'idMedecin',
                select: 'nom',
                model: 'Medecin'
            })
            .sort({ DatePres: -1 })
            .lean();

        const result = prestations.map((p: any) => ({
            id: p._id,
            code: p.CodePrestation || "N/A",
            patient: p.PatientP || (p.IdPatient ? `${p.IdPatient.Nom || ''} ${p.IdPatient.Prenoms || ''}`.trim() : "Patient inconnu"),
            designation: p.Designationtypeacte || "Prestation sans désignation",
            // Calcul du montant selon la logique WLanguage: Partassure + TotalReliquatPatient
            montant: Number((p.Partassure || 0) + (p.TotalReliquatPatient || 0)),
            medecin: p.NomMed || (p.idMedecin ? p.idMedecin.nom : ""),
            assure: p.Assure || "Non assuré",
            statut: p.statutPrescriptionMedecin || 0,
            date: p.DatePres ? new Date(p.DatePres).toLocaleDateString() : "Date inconnue"
        }));

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("Erreur lors du chargement des prestations:", error);
        return NextResponse.json(
            {
                error: "Une erreur est survenue lors du chargement des prestations",
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            },
            { status: 500 }
        );
    }
}