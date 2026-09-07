import { NextRequest, NextResponse } from "next/server";
import { IConsultation } from "@/models/consultation";
import { IFacturation } from "@/models/Facturation";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

export const dynamic = "force-dynamic";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");
    const Facturation = getTenantModel<IFacturation>(context.connection, "Facturation");

    try {
        // Logique WinDev : CONSULTATION AVEC CONSULTATION.StatuPrescriptionMedecin >= 2 ET CONSULTATION.Restapayer <> 0
        let consultationsNonSoldées: any[] = [];
        try {
            consultationsNonSoldées = await Consultation.find({
                statutPrescriptionMedecin: 3,
                Restapayer: { $ne: 0 }
            })
                .sort({ Date_consulation: -1 })
                .lean();
        } catch (err) {
            console.error("Erreur consultations non soldées:", err);
        }

        // Logique WinDev : FACTURATION AVEC FACTURATION.Restapayer <> 0
        let facturationsNonSoldées: any[] = [];
        try {
            facturationsNonSoldées = await Facturation.find({
                Restapayer: { $ne: 0 }
            })
                .sort({ DatePres: -1 })
                .lean();
        } catch (err) {
            console.error("Erreur facturations non soldées:", err);
        }

        const result = [
            // Consultations non soldées
            ...consultationsNonSoldées.map((c: any) => {
                try {
                    return {
                        id: c._id?.toString() || "",
                        code: c.CodePrestation || "N/A",
                        idPatient: c.IdPatient?.toString() || "",
                        patient: c.PatientP || "Patient inconnu",
                        designation: c.designationC || "Consultation",
                        montantRestant: Number(c.Restapayer) || 0,
                        type: "consultation",
                        medecin: c.Medecin || "Médecin inconnu",
                        statut: c.StatutPaiement || "En attente",
                        date: c.Date_consulation ? new Date(c.Date_consulation).toLocaleDateString() : "Date inconnue"
                    };
                } catch (mapError) {
                    console.error("Erreur mapping consultation:", mapError);
                    return null;
                }
            }).filter(Boolean),

            // Facturations non soldées
            ...facturationsNonSoldées.map((f: any) => {
                try {
                    return {
                        id: f._id?.toString() || "",
                        code: f.CodePrestation || "N/A",
                        idPatient: f.IdPatient?.toString() || "",
                        patient: f.PatientP || "Patient inconnu",
                        designation: f.Designationtypeacte || "Facturation",
                        montantRestant: Number(f.Restapayer) || 0,
                        type: "facturation",
                        medecin: f.NomMed || "Médecin inconnu",
                        statut: f.StatutPaiement || "En attente",
                        date: f.DatePres ? new Date(f.DatePres).toLocaleDateString() : "Date inconnue"
                    };
                } catch (mapError) {
                    console.error("Erreur mapping facturation:", mapError);
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
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors du chargement des factures non soldées:", error);
        return NextResponse.json(
            {
                error: "Une erreur est survenue lors du chargement des factures non soldées",
                details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
                data: []
            },
            { status: 500 }
        );
    }
}
