import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";          // ✅ OBLIGATOIRE
import { Patient } from "@/models/patient";          // ✅ pour PatientRef
import { Prescription } from "@/models/Prescription";
//import { Prescription } from "@/models/prescription"; // ✅ pour Prescription populate

export async function GET(req: NextRequest) {
    await db();

    try {
        const { searchParams } = new URL(req.url);
        const statut = searchParams.get('statut');
        const paye = searchParams.get('paye');

        // Filtre initial selon la logique spécifiée
        // Cas 1: StatuPrescriptionMedecin=2 et Payéoupas=faux
        // Cas 2: StatuPrescriptionMedecin<=2 et Payéoupas=vrai
        const filter: any = {
            $or: [
                // Cas 1: StatuPrescriptionMedecin=2 et Payéoupas=faux
                {
                    StatuPrescriptionMedecin: statut ? parseInt(statut) : 2,
                    Payéoupas: { $ne: true }
                },
                // Cas 2: StatuPrescriptionMedecin<=2 et Payéoupas=vrai
                {
                    StatuPrescriptionMedecin: { $lte: statut ? parseInt(statut) : 2 },
                    Payéoupas: true
                }
            ]
        };
        // Si paye est spécifié, on filtre en conséquence
        if (paye === 'true') {
            // Uniquement les prescriptions payées avec StatuPrescriptionMedecin<=2
            filter.$or = [
                {
                    StatuPrescriptionMedecin: { $lte: statut ? parseInt(statut) : 2 },
                    Payéoupas: true
                }
            ];
        } else if (paye === 'false' || paye === null) {
            // Uniquement les prescriptions non payées avec StatuPrescriptionMedecin=2
            filter.$or = [
                {
                    StatuPrescriptionMedecin: statut ? parseInt(statut) : 2,
                    Payéoupas: { $ne: true }
                }
            ];
        }

        const prescriptions = await Prescription.find(filter)
            .populate({
                path: 'IDMEDECIN',
                select: 'nom',
                model: 'Medecin'
            })
            .sort({ DatePres: -1 })
            .lean();

        const result = prescriptions.map((p: any) => ({
            id: p._id,
            code: p.CodePrestation || "N/A",
            patient: p.PatientP || "Patient inconnu",
            designation: p.Designation || "PHARMACIE",
            // Calcul du montant selon la logique : TotalapayerPatient ou Montanttotal
            montant: Number(p.TotalapayerPatient || p.Montanttotal || 0),
            medecin: p.NomMed || (p.IDMEDECIN ? p.IDMEDECIN.nom : ""),
            assure: p.Assurance || "Non assuré",
            statut: p.StatuPrescriptionMedecin || 0,
            date: p.DatePres ? new Date(p.DatePres).toLocaleDateString() : "Date inconnue",
            type: "PRESCRIPTION",
            // Ajout des champs supplémentaires pour cohérence
            Payéoupas: p.Payéoupas || false,
            StatutPaiement: p.StatutPaiement || "En cours de Paiement",
            Rclinique: p.Rclinique || ""
        }));

        return NextResponse.json(result);
    } catch (err) {
        console.error("Erreur lors du chargement des prescriptions:", err);
        return NextResponse.json(
            { error: "Une erreur est survenue lors du chargement des prescriptions" },
            { status: 500 }
        );
    }
}