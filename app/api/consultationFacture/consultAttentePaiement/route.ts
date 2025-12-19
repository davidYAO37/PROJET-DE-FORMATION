import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { Medecin } from "@/models/medecin";        // ✅ Ajout important
import { Patient } from "@/models/patient";        // ✅ Pour le populate IdPatient
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();

    try {
        // Récupérer les paramètres de requête
        const { searchParams } = new URL(req.url);
        const statut = searchParams.get('statut');
        const paye = searchParams.get('paye');

        // Filtre initial selon la logique WLanguage
        // - StatutC: false (consultation non clôturée)
        // - StatutPrescriptionMedecin: 2 (non facturé)
        const filter: any = {
            StatutC: false,
            StatuPrescriptionMedecin: 2 // 2 = non facturé
        };

        // Si un statut spécifique est fourni dans la requête
        if (statut) {
            filter.StatuPrescriptionMedecin = parseInt(statut);
        }

        // Filtre supplémentaire si paye est spécifié
        if (paye !== null) {
            filter.StatutPaiement = paye === 'true' ? 'Payé' : 'En cours de Paiement';
        }

        const consultations = await Consultation.find(filter)
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

        const result = consultations.map((c: any) => ({
            id: c._id,
            code: c.CodePrestation || "N/A",
            patient: c.PatientP || (c.IdPatient ? `${c.IdPatient?.Nom || ''} ${c.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
            designation: c.designationC || "Consultation",
            // Calcul du montant selon la logique WLanguage: tiket_moderateur + ReliquatPatient
            montant: Number((c.tiket_moderateur || 0) + (c.ReliquatPatient || 0)),
            medecin: c.Medecin || (c.IDMEDECIN ? c.IDMEDECIN?.nom : ""),
            assure: c.Assuré || "Non assuré",
            statut: c.StatutPaiement || "En attente",
            statutPrescription: c.StatuPrescriptionMedecin || 0,
            date: c.Date_consulation ? new Date(c.Date_consulation).toLocaleDateString() : "Date inconnue"
        }));

        return NextResponse.json(result);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("Erreur lors du chargement des consultations:", error);
        return NextResponse.json(
            {
                error: "Une erreur est survenue lors du chargement des consultations",
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            },
            { status: 500 }
        );
    }
}
