import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Prescription } from "@/models/Prescription";

// GET /api/prescription/[id] - Récupérer une prescription par ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const prescription = await Prescription.findById(id).lean();

        if (!prescription) {
            return NextResponse.json({ error: "Prescription non trouvée" }, { status: 404 });
        }

        return NextResponse.json(prescription);
    } catch (error: any) {
        console.error("Erreur GET /api/prescription/[id]:", error);
        return NextResponse.json({
            error: "Erreur lors de la récupération de la prescription",
            details: error.message
        }, { status: 500 });
    }
}

// PUT /api/prescription/[id] - Mettre à jour une prescription
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const body = await request.json();

        console.log("🔄 PUT /api/prescription/[id] - ID:", id, "Body:", body);
        console.log("📊 StatuPrescriptionMedecin reçu:", body.statutPrescriptionMedecin || body.StatuPrescriptionMedecin);

        // Mapper les champs du composant vers le modèle
        const prescriptionData: any = {
            Designation: body.Designation || "PHARMACIE",
            CodePrestation: body.CodePrestation || body.CodePrestation,
            PatientP: body.PatientP,
            IdPatient: body.IdPatient || body.IDPARTIENT || "", // Unified field - supports both parameter names
            DatePres: body.DatePres ? new Date(body.DatePres) : body.DatePres,
            SaisiPar: body.Caissiere || body.SaisiPar,
            Rclinique: body.Rclinique || "",
            Montanttotal: body.Montanttotal,
            Taux: body.Taux,
            PartAssurance: body.PartAssuranceP || body.PartAssurance,
            PartAssure: body.Partassuré || body.PartAssure,
            Remise: body.REMISE || body.Remise,
            MotifRemise: body.MotifRemise,
            Assurance: body.Assurance,
            MontantRecu: body.MontantRecu || body.Montanttotal,
            Restapayer: body.Restapayer,
            NomMed: body.NomMed,
            StatutFacture: body.StatutFacture !== undefined ? body.StatutFacture : true,
            Numfacture: body.Numfacture,
            NumBon: body.NumBon || body.Numcarte,
            Modepaiement: body.Modepaiement,
            // Les champs exclus de la facturation ne sont pas mappés ici. Cela évite que
            // des valeurs parasites soient enregistrées lors du passage en caisse.
            // Document: body.Document,
            // ExtensionF: body.ExtensionF,
            Souscripteur: body.Souscripteur,
            StatutPaiement: body.StatutPaiement || "Facture payée",
            // Ordonnerlannulation: body.Ordonnerlannulation,
            // AnnulationOrdonneLe: body.AnnulationOrdonneLe,
            // AnnulationOrdonnePar: body.AnnulationOrdonnePar,
            SOCIETE_PATIENT: body.SOCIETE_PATIENT,

            // Champs supplémentaires pour la pharmacie
            StatuPrescriptionMedecin: body.StatuPrescriptionMedecin || body.statutPrescriptionMedecin,
            Payéoupas: body.Payéoupas,
            Payele: body.Payele,
            Heure: body.Heure,
            TotalapayerPatient: body.TotalapayerPatient,
            IDpriseCharge: body.IDpriseCharge,
            Caissiere: body.Caissiere
        };

        console.log("📋 prescriptionData.StatuPrescriptionMedecin:", prescriptionData.StatuPrescriptionMedecin);

        // Gérer les champs ObjectId - ne les inclure que s'ils sont valides
        if (body.IDASSURANCE && body.IDASSURANCE.trim() !== "") {
            prescriptionData.IDASSURANCE = body.IDASSURANCE;
        }

        if (body.IDMEDECIN && body.IDMEDECIN.trim() !== "") {
            prescriptionData.idMedecin = body.IDMEDECIN;
        }

        // IdPatient déjà mappé ci-dessus avec fallback, pas de vérification supplémentaire nécessaire

        if (body.IDSOCIETEASSURANCE && body.IDSOCIETEASSURANCE.trim() !== "") {
            prescriptionData.IDSOCIETEASSURANCE = body.IDSOCIETEASSURANCE;
        } else if (body.IDASSURANCE && body.IDASSURANCE.trim() !== "") {
            prescriptionData.IDSOCIETEASSURANCE = body.IDASSURANCE;
        }

        const updated = await Prescription.findByIdAndUpdate(id, prescriptionData, { new: true });

        if (!updated) {
            return NextResponse.json({
                error: "Prescription introuvable"
            }, { status: 404 });
        }

        console.log("✅ Prescription mise à jour - StatuPrescriptionMedecin:", updated.StatuPrescriptionMedecin);

        return NextResponse.json({
            success: true,
            data: updated,
            message: "Prescription mise à jour avec succès"
        });
    } catch (error: any) {
        console.error("Erreur PUT /api/prescription/[id]:", error);
        return NextResponse.json({
            error: "Erreur lors de la mise à jour de la prescription",
            details: error.message
        }, { status: 500 });
    }
}

