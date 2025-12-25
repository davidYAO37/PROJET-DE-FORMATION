import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { PatientPrescription } from "@/models/PatientPrescription";
import { Medecin } from "@/models/medecin";          // ✅ OBLIGATOIRE
import { Patient } from "@/models/patient";          // ✅ pour PatientRef
//import { Prescription } from "@/models/prescription"; // ✅ pour Prescription populate

export async function GET(req: NextRequest) {
    await db();

    try {
        const { searchParams } = new URL(req.url);
        const statut = searchParams.get('statut');
        const paye = searchParams.get('paye');

        // Filtre initial selon la logique WLanguage
        // - Payéoupas: false (non payé) ou lignes non facturées si déjà payé
        // - statutPrescriptionMedecin: 2 (non facturé)
        const filter: any = {
            $or: [
                // Cas 1: Non payé et statut 2
                {
                    Payele: { $ne: true },
                    statutPrescriptionMedecin: statut ? parseInt(statut) : 2
                },
                // Cas 2: Payé mais avec des lignes non facturées (géré dans la logique du frontend)
                {
                    Payele: true,
                    statutPrescriptionMedecin: statut ? parseInt(statut) : 2
                }
            ]
        };

        // Si paye est spécifié, on filtre en conséquence
        if (paye === 'true') {
            filter.$or = [
                { Payele: true, statutPrescriptionMedecin: statut ? parseInt(statut) : 2 }
            ];
        } else if (paye === 'false' || paye === null) {
            filter.$or = [
                {
                    $or: [
                        { Payele: { $ne: true } },
                        { Payele: { $exists: false } }
                    ],
                    statutPrescriptionMedecin: statut ? parseInt(statut) : 2
                }
            ];
        }

        const prescriptions = await PatientPrescription.find(filter)
            .populate({
                path: 'PatientRef',
                select: 'Nom Prenoms',
                model: 'Patient'
            })
            .populate({
                path: 'Prescription',
                select: 'CodePrestation designation',
                model: 'Prescription'
            })
            .populate({
                path: 'IDMEDECIN',
                select: 'nom',
                model: 'Medecin'
            })
            .sort({ DatePrescription: -1 })
            .lean();

        const result = prescriptions.map((p: any) => ({
            id: p._id,
            code: p.CodePrestation || (p.Prescription?.CodePrestation) || "N/A",
            patient: p.PatientP || (p.PatientRef ? `${p.PatientRef.Nom || ''} ${p.PatientRef.Prenoms || ''}`.trim() : "Patient inconnu"),
            designation: p.Prescription?.designation || "Ordonnance",
            // Calcul du montant selon la logique WLanguage: Partassuré
            montant: Number(p.Partassuré || 0),
            medecin: p.NomMed || (p.IDMEDECIN?.nom) || "",
            assure: p.SocieteAssurance || "Non assuré",
            statut: p.statutPrescriptionMedecin || 0,
            date: p.DatePrescription ? new Date(p.DatePrescription).toLocaleDateString() : "Date inconnue",
            type: "PRESCRIPTION"
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
