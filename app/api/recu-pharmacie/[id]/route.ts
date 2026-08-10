import { NextRequest, NextResponse } from "next/server";
import { IPatientPrescription } from "@/models/PatientPrescription";
import { IFacturation } from "@/models/Facturation";
import { Types } from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier"];

export async function GET(req: NextRequest, routeContext: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const PatientPrescription = getTenantModel<IPatientPrescription>(context.connection, "PatientPrescription");
  const Facturation = getTenantModel<IFacturation>(context.connection, "Facturation");
  const { id } = await routeContext.params;

  try {     
    

    if (!id || id.trim() === '') {
        return NextResponse.json({
            error: "ID de facturation manquant",
            details: "Le paramètre id est requis"
        }, { status: 400 });
    }

    // Valider le format de l'ID
    if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({
            error: "ID de facturation invalide",
            details: "Le format de l'ID n'est pas valide"
        }, { status: 400 });
    }

   

    // Logique WLangage: FACTURATION.IDFACTURATION = PARTIENT_PRESCRIPTION.IDFACTURATION
    // avec StatutPrescriptionMedecin = 3
    const prescriptions = await PatientPrescription.find({
        facturation: new Types.ObjectId(id),
        StatutPrescriptionMedecin: 3
    })
    .populate('facturation')
    .lean();


    if (prescriptions.length === 0) {
        return NextResponse.json({
            error: "Aucune prescription trouvée",
            details: "Aucune prescription avec ce statut pour cette facturation"
        }, { status: 404 });
    }

    // Prendre la facturation du premier élément (elles devraient toutes avoir la même)
    const facturation = prescriptions[0].facturation as any;

    // Ajouter les informations du médicament si disponible
    const lignes = prescriptions.map(p => ({
        ...p,
        nomMedicament: p.nomMedicament || ''
    }));


    return NextResponse.json({
        facturation: facturation,
        lignes: lignes
    });
  } catch (error: any) {
   
    return NextResponse.json({
        error: "Erreur lors de la récupération du reçu pharmacie",
        details: error.message
    }, { status: 500 });
  }
}