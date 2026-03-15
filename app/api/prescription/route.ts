import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Prescription } from "@/models/Prescription";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const CodePrestation = searchParams.get("CodePrestation");

    await db();

    try {
        // Recherche la prescription par CodePrestation, en excluant les champs
        // que la caisse n'a pas besoin de voir (documents/annulations).
        const prescription = await Prescription.findOne({ CodePrestation: CodePrestation })
            .select('-Document -ExtensionF -Ordonnerlannulation -AnnulationOrdonneLe -AnnulationOrdonnePar')
            .lean();

        if (!prescription) {
            return NextResponse.json({}, { status: 200 }); // Retourner un objet vide si non trouvé
        }

        return NextResponse.json(prescription);
    } catch (error) {
        console.error("Erreur API prescription:", error);
        return NextResponse.json({ error: "Erreur lors de la récupération de la prescription" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await db();

    try {
        const body = await request.json();

        // Mapper les champs du composant vers le modèle
        const prescriptionData: any = {
            Designation: body.Designation || "PHARMACIE",
            CodePrestation: body.CodePrestation,
            PatientP: body.PatientP,
            IdPatient: body.IdPatient || body.IDPARTIENT || "", // Unified field - supports both parameter names
            DatePres: body.DatePres ? new Date(body.DatePres) : new Date(),
            SaisiPar: body.Caissiere,
            Rclinique: body.Rclinique || "",
            Montanttotal: body.Montanttotal,
            Taux: body.Taux,
            PartAssurance: body.PartAssuranceP || body.PartAssurance,
            PartAssure: body.Partassuré || body.PartAssure,
            Remise: body.REMISE || body.Remise,
            MotifRemise: body.MotifRemise,
            Assurance: body.Assurance,
            IDASSURANCE: body.IDASSURANCE,
            MontantRecu: body.MontantRecu || body.Montanttotal,
            Restapayer: body.Restapayer,
            NomMed: body.NomMed,
            IDMEDECIN: body.IDMEDECIN,
            StatutFacture: true,
            //Numfacture: body.Numfacture,
            NumBon: body.NumBon || body.Numcarte,
            Modepaiement: body.Modepaiement,

            Souscripteur: body.Souscripteur,
            StatutPaiement: body.StatutPaiement || "Facture payée",
            SOCIETE_PATIENT: body.SOCIETE_PATIENT,
            IDSOCIEPATASSUANCE: body.IDSOCIETEASSURANCE,
            // Champs supplémentaires pour la pharmacie

            // Champs supplémentaires pour la pharmacie
            StatuPrescriptionMedecin: body.StatuPrescriptionMedecin,
            Payéoupas: body.Payéoupas,
            Payele: body.Payele,
            Heure: body.Heure,
            TotalapayerPatient: body.TotalapayerPatient,
            IDpriseCharge: body.IDpriseCharge,
            Caissiere: body.Caissiere
        };

        // Gérer les champs ObjectId - ne les inclure que s'ils sont valides
        if (body.IDASSURANCE && body.IDASSURANCE.trim() !== "") {
            prescriptionData.IDASSURANCE = body.IDASSURANCE;
        }

        if (body.IDMEDECIN && body.IDMEDECIN.trim() !== "") {
            prescriptionData.idMedecin = body.IDMEDECIN;
        }

        if (body.IdPatient && body.IdPatient.trim() !== "") {
            prescriptionData.IdPatient = body.IdPatient;
        } else if (body.IDPARTIENT && body.IDPARTIENT.trim() !== "") {
            prescriptionData.IdPatient = body.IDPARTIENT;
        }

        if (body.IDSOCIETEASSURANCE && body.IDSOCIETEASSURANCE.trim() !== "") {
            prescriptionData.IDSOCIETEASSURANCE = body.IDSOCIETEASSURANCE;
        } else if (body.IDASSURANCE && body.IDASSURANCE.trim() !== "") {
            prescriptionData.IDSOCIETEASSURANCE = body.IDASSURANCE;
        }

        // Créer une nouvelle prescription
        const newPrescription = await Prescription.create(prescriptionData);

        return NextResponse.json({
            success: true,
            data: newPrescription,
            message: "Prescription créée avec succès"
        });
    } catch (error: any) {
        console.error("Erreur création prescription:", error);
        return NextResponse.json({
            error: "Erreur lors de la création de la prescription",
            details: error.message
        }, { status: 500 });
    }
}
