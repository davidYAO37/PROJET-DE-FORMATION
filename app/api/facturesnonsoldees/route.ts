import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { Facturation } from "@/models/Facturation";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();

    try {
        let facturationsNonSoldées: any[] = [];
        let consultationsNonSoldées: any[] = [];

        // Récupérer les facturations avec reste à payer > 0
        try {
            facturationsNonSoldées = await Facturation.find({
                Restapayer: { $gt: 0, $exists: true } // reste à payer > 0 et existe
            })
            .populate({
                path: 'IdPatient',
                select: 'Nom Prenoms',
                model: 'Patient'
            })
            .sort({ DateFacturation: -1 })
            .lean();
        } catch (factError) {
            console.error("Erreur lors de la récupération des facturations:", factError);
        }

        // Récupérer les consultations avec statutPrescriptionMedecin = 3 et reste à payer > 0
        try {
            consultationsNonSoldées = await Consultation.find({
                statutPrescriptionMedecin: 3, // 3 = facturé mais non soldé
                Restapayer: { $gt: 0, $exists: true } // reste à payer > 0 et existe
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
        } catch (consultError) {
            console.error("Erreur lors de la récupération des consultations:", consultError);
        }

        const result = [
            // Ajouter les facturations non soldées
            ...facturationsNonSoldées.map((f: any) => {
                try {
                    return {
                        id: f._id?.toString() || "",
                        code: f.CodePrestation || "N/A",
                        patient: f.PatientP || (f.IdPatient ? `${f.IdPatient?.Nom || ''} ${f.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
                        designation: f.Designationtypeacte || "Facturation",
                        montantRestant: Number(f.Restapayer || 0),
                        type: 'facturation',
                        medecin: f.NomMed || "Medecin inconnu",
                        statut: f.StatutPaiement || "En attente",
                        date: f.DateFacturation ? new Date(f.DateFacturation).toLocaleDateString() : "Date inconnue"
                    };
                } catch (mapError) {
                    console.error("Erreur lors du mapping d'une facturation:", mapError);
                    return null;
                }
            }).filter(Boolean),
            // Ajouter les consultations non soldées
            ...consultationsNonSoldées.map((c: any) => {
                try {
                    return {
                        id: c._id?.toString() || "",
                        code: c.CodePrestation || "N/A",
                        patient: c.PatientP || (c.IdPatient ? `${c.IdPatient?.Nom || ''} ${c.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
                        designation: c.designationC || "Consultation",
                        montantRestant: Number(c.Restapayer || 0),
                        type: 'consultation',
                        medecin: c.Medecin || (c.IDMEDECIN ? c.IDMEDECIN?.nom : ""),
                        assure: c.Assure || "Non assuré",
                        statut: c.StatutPaiement || "En attente",
                        date: c.Date_consulation ? new Date(c.Date_consulation).toLocaleDateString() : "Date inconnue"
                    };
                } catch (mapError) {
                    console.error("Erreur lors du mapping d'une consultation:", mapError);
                    return null;
                }
            }).filter(Boolean)
        ];

        return NextResponse.json(result);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("Erreur lors du chargement des factures non soldées:", error);
        return NextResponse.json(
            {
                error: "Une erreur est survenue lors du chargement des factures non soldées",
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                data: [] // Retourner un tableau vide en cas d'erreur
            },
            { status: 500 }
        );
    }
}
