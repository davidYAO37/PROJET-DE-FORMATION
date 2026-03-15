import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { PatientPrescription } from "@/models/PatientPrescription";
import { IFacturation } from "@/models/Facturation";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await context.params;

    try {     

        if (!id) {
            return NextResponse.json({
                error: "ID de facturation manquant",
                details: "Le paramètre id est requis"
            }, { status: 400 });
        }

        // Trouver les prescriptions patient avec facturation = id et StatutPrescriptionMedecin = 3
        const prescriptions = await PatientPrescription.find({
            facturation: id,
            StatutPrescriptionMedecin: 3
        }).populate('facturation').lean();

        if (prescriptions.length === 0) {
            return NextResponse.json({
                error: "Aucune prescription trouvée",
                details: "Aucune prescription avec ce statut pour cette facturation"
            }, { status: 404 });
        }

        // Prendre la facturation du premier élément (elles devraient toutes avoir la même)
        const facturation = prescriptions[0].facturation as unknown as IFacturation;

        // Mapper les données pour correspondre aux champs du SQL
        const lignes = prescriptions.map(p => ({
            QtéP: p.QteP,
            Posologie: p.posologie,
            DatePres: p.DatePres,
            prixunitaire: p.prixUnitaire,
            PrixTotal: p.prixTotal,
            PartAssurance: p.partAssurance,
            Partassuré_PA: p.partAssure,
            nomMedicament: p.nomMedicament,
            StatuPrescriptionMedecin: p.StatutPrescriptionMedecin,
            // Champs supplémentaires pour correspondre au modèle
            _id: p._id,
            actePayeCaisse: p.actePayeCaisse
        }));

        return NextResponse.json({
            facturation: facturation,
            lignes: lignes
        });
    } catch (error: any) {
        console.error("Erreur GET /api/recu-pharmacie/[id]:", error);
        return NextResponse.json({
            error: "Erreur lors de la récupération du reçu pharmacie",
            details: error.message
        }, { status: 500 });
    }
}