import { NextRequest, NextResponse } from "next/server";
import { IConsultation } from "@/models/consultation";
import { IFacturation } from "@/models/Facturation";
import { IMedecin } from "@/models/medecin";
import { IPatient } from "@/models/patient";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

export const dynamic = "force-dynamic";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");
    const Facturation = getTenantModel<IFacturation>(context.connection, "Facturation");
    const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
    const Patient = getTenantModel<IPatient>(context.connection, "Patient");

    try {
        let facturationsNonSoldées: any[] = [];
        let consultationsNonSoldées: any[] = [];

        // Récupérer les facturations avec reste réel à payer > 0
        // Le reste est calculé : Montanttotal - MontantRecu (ou TotalPaye)
        try {
            facturationsNonSoldées = await Facturation.find({
                $expr: {
                    $gt: [
                        { $subtract: [{ $ifNull: ["$Montanttotal", 0] }, { $ifNull: ["$MontantRecu", { $ifNull: ["$TotalPaye", 0] }] }] },
                        0
                    ]
                }
            })
            .populate({
                path: 'IdPatient',
                select: 'Nom Prenoms',
                model: Patient
            })
            .sort({ DateFacturation: -1 })
            .lean();
        } catch (factError) {
            console.error("Erreur lors de la récupération des facturations:", factError);
        }

        // Récupérer les consultations facturées avec reste réel > 0
        // Le reste est calculé : PrixClinique - Montantencaisse
        try {
            consultationsNonSoldées = await Consultation.find({
                statutPrescriptionMedecin: 3, // 3 = facturé mais non soldé
                $expr: {
                    $gt: [
                        { $subtract: [{ $ifNull: ["$PrixClinique", { $ifNull: ["$montantapayer", 0] }] }, { $ifNull: ["$Montantencaisse", 0] }] },
                        0
                    ]
                }
            })
            .populate({
                path: 'IdPatient',
                select: 'Nom Prenoms',
                model: Patient
            })
            .populate({
                path: 'IDMEDECIN',
                select: 'nom',
                model: Medecin
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
                        idPatient: f.IdPatient?._id?.toString() || f.IdPatient?.toString() || "",
                        patient: f.PatientP || (f.IdPatient ? `${f.IdPatient?.Nom || ''} ${f.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
                        designation: f.Designationtypeacte || "Facturation",
                        montantRestant: Number((f.Montanttotal || 0) - (f.MontantRecu || f.TotalPaye || 0)),
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
                        idPatient: c.IdPatient?._id?.toString() || c.IdPatient?.toString() || "",
                        patient: c.PatientP || (c.IdPatient ? `${c.IdPatient?.Nom || ''} ${c.IdPatient?.Prenoms || ''}`.trim() : "Patient inconnu"),
                        designation: c.designationC || "Consultation",
                        montantRestant: Number((c.PrixClinique || c.montantapayer || 0) - (c.Montantencaisse || 0)),
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

        return NextResponse.json(result, {
            headers: {
                "Cache-Control": "no-store, max-age=0",
                Vary: "*",
            },
        });

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
