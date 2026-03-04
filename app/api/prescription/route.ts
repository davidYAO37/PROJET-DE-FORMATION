import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Prescription } from "@/models/Prescription";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const CodePrestation = searchParams.get("CodePrestation");

    await db();

    try {
        // Recherche la prescription par CodePrestation
        const prescription = await Prescription.findOne({ CodePrestation: CodePrestation }).lean();
        
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
            CodePrestation: body.Code_Prestation,
            PatientP: body.PatientP,
            DatePres: body.DatePres ? new Date(body.DatePres) : new Date(),
            SaisiPar: body.FacturéPar,
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
            StatutFacture: true,
            Numfacture: body.Numfacture,
            NumBon: body.NumBon || body.Numcarte,
            Modepaiement: body.Modepaiement,
            Document: body.Document,
            ExtensionF: body.ExtensionF,
            Souscripteur: body.Souscripteur,
            StatutPaiement: body.StatutPaiement || "Facture payée",
            Ordonnerlannulation: body.Ordonnerlannulation,
            AnnulationOrdonneLe: body.AnnulationOrdonneLe,
            AnnulationOrdonnePar: body.AnnulationOrdonnePar,
            SOCIETE_PATIENT: body.SOCIETE_PATIENT,
            
            // Champs supplémentaires pour la pharmacie
            StatuPrescriptionMedecin: body.StatuPrescriptionMedecin,
            Payéoupas: body.Payéoupas,
            Payele: body.Payele,
            Heure: body.Heure,
            TotalapayerPatient: body.TotalapayerPatient,
            IDpriseCharge: body.IDpriseCharge,
            FacturéPar: body.FacturéPar
        };
        
        // Gérer les champs ObjectId - ne les inclure que s'ils sont valides
        if (body.IDASSURANCE && body.IDASSURANCE.trim() !== "") {
            prescriptionData.IDASSURANCE = body.IDASSURANCE;
        }
        
        if (body.IDMEDECIN && body.IDMEDECIN.trim() !== "") {
            prescriptionData.idMedecin = body.IDMEDECIN;
        }
        
        if (body.IDSOCEITEASSUANCE && body.IDSOCEITEASSUANCE.trim() !== "") {
            prescriptionData.IDSOCEITEASSUANCE = body.IDSOCEITEASSUANCE;
        } else if (body.IDASSURANCE && body.IDASSURANCE.trim() !== "") {
            prescriptionData.IDSOCEITEASSUANCE = body.IDASSURANCE;
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
