import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Prescription } from "@/models/Prescription";

export async function GET(req: NextRequest) {
    await db();

    try {
        const { searchParams } = new URL(req.url);
        const statut = searchParams.get('statut');
        const paye = searchParams.get('paye');

        // Filtre initial pour récupérer les prescriptions en attente de paiement
        // StatuPrescriptionMedecin = 2 (non facturé) ET Payéoupas = false (non payé)
        const filter: any = {
            StatuPrescriptionMedecin: statut ? parseInt(statut) : 2,
            Payéoupas: { $ne: true }
        };

        // Si un statut spécifique est fourni dans la requête
        if (statut) {
            filter.StatuPrescriptionMedecin = parseInt(statut);
        }

        // Filtre supplémentaire si paye est spécifié
        if (paye !== null) {
            if (paye === 'true') {
                // Uniquement les prescriptions payées
                filter.Payéoupas = true;
            } else if (paye === 'false') {
                // Uniquement les prescriptions non payées
                filter.Payéoupas = { $ne: true };
            }
        }

        const prescriptions = await Prescription.find(filter)
            .populate({
                path: 'IDMEDECIN',
                select: 'nom',
                model: 'Medecin'
            })
            .populate({
                path: 'IdPatient',
                select: 'Nom Prenoms',
                model: 'Patient'
            })
            .sort({ DatePres: -1 })
            .lean();

        const result = prescriptions.map((p: any) => {
            try {
                return {
                    id: p._id?.toString() || "",
                    code: p.CodePrestation || "N/A",
                    patient: p.PatientP || (p.IdPatient ? `${p.IdPatient?.Nom || ''} ${p.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
                    designation: p.Designation || "PHARMACIE",
                    // Calcul du montant selon la logique : TotalapayerPatient ou Montanttotal
                    montant: Number(p.TotalapayerPatient || p.Montanttotal || 0),
                    medecin: p.NomMed || (p.IDMEDECIN ? p.IDMEDECIN?.nom : ""),
                    assure: p.Assurance || "Non assuré",
                    statut: p.StatuPrescriptionMedecin || 0,
                    date: p.DatePres ? new Date(p.DatePres).toLocaleDateString() : "Date inconnue",
                    type: "PRESCRIPTION",
                    // Ajout des champs supplémentaires pour cohérence
                    Payéoupas: p.Payéoupas || false,
                    StatutPaiement: p.StatutPaiement || "En cours de Paiement",
                    Rclinique: p.Rclinique || ""
                };
            } catch (mapError) {
                console.error("Erreur lors du mapping d'une prescription:", mapError);
                return null;
            }
        }).filter(Boolean);

        return NextResponse.json(result);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error("Erreur lors du chargement des prescriptions:", err);
        return NextResponse.json(
            { 
                error: "Une erreur est survenue lors du chargement des prescriptions",
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                data: [] // Retourner un tableau vide en cas d'erreur
            },
            { status: 500 }
        );
    }
}