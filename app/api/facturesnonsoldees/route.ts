import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { Facturation } from "@/models/Facturation";
import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";          // ✅ OBLIGATOIRE
import { Patient } from "@/models/patient";          // ✅ pour PatientRef

export async function GET(req: NextRequest) {
    await db();

    try {
        // Récupérer les facturations avec reste à payer > 0
        const facturationsNonSoldées = await Facturation.find({
            Restapayer: { $gt: 0 } // reste à payer > 0
        })
        .populate({
            path: 'IdPatient',
            select: 'Nom Prenoms',
            model: 'Patient'
        })
        .sort({ DateFacturation: -1 })
        .lean();

        // Récupérer les consultations avec StatuPrescriptionMedecin = 3 et reste à payer > 0
        const consultationsNonSoldées = await Consultation.find({
            statutPrescriptionMedecin: 3, // 3 = facturé mais non soldé
            Restapayer: { $gt: 0 } // reste à payer > 0
        })
        .populate({
            path: 'IdPatient',
            select: 'Nom Prenoms',
            model: 'Patient'
        })
        .populate({
            path: 'IDMEDECIN',
            select: 'nom',
            model: 'Medecin'
        })
        .sort({ Date_consulation: -1 })
        .lean();

        const result = [
            // Ajouter les facturations non soldées
            ...facturationsNonSoldées.map((f: any) => ({
                id: f._id,
                code: f.CodePrestation || "N/A",
                patient: f.PatientP || (f.IdPatient ? `${f.IdPatient?.Nom || ''} ${f.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
                designation: f.Designationtypeacte || "Facturation",
                montantRestant: Number(f.Restapayer || 0),
                type: 'facturation',
                statut: f.StatutPaiement || "En attente",
                date: f.DateFacturation ? new Date(f.DateFacturation).toLocaleDateString() : "Date inconnue"
            })),
            // Ajouter les consultations non soldées
            ...consultationsNonSoldées.map((c: any) => ({
                id: c._id,
                code: c.CodePrestation || "N/A",
                patient: c.PatientP || (c.IdPatient ? `${c.IdPatient?.Nom || ''} ${c.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
                designation: c.designationC || "Consultation",
                montantRestant: Number(c.Restapayer || 0),
                type: 'consultation',
                medecin: c.Medecin || (c.IDMEDECIN ? c.IDMEDECIN?.nom : ""),
                assure: c.Assure || "Non assuré",
                statut: c.StatutPaiement || "En attente",
                date: c.Date_consulation ? new Date(c.Date_consulation).toLocaleDateString() : "Date inconnue"
            }))
        ];

        return NextResponse.json(result);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("Erreur lors du chargement des factures non soldées:", error);
        return NextResponse.json(
            {
                error: "Une erreur est survenue lors du chargement des factures non soldées",
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            },
            { status: 500 }
        );
    }
}
