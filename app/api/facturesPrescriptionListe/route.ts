// app/api/facturesPrescriptionListe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Facturation } from "@/models/Facturation";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const IDPRESCRIPTION = searchParams.get("IDPRESCRIPTION");

        if (!IDPRESCRIPTION) {
            return NextResponse.json(
                { error: "L'ID de la prescription est requis" },
                { status: 400 }
            );
        }

        // Rechercher toutes les facturations liées à cette prescription
        const factures = await Facturation.find({ IDPRESCRIPTION: IDPRESCRIPTION })
            .populate("IDASSURANCE", "desiganationassurance")
            .populate("IDMEDECIN", "Nom prenoms")
            .populate("IdPatient", "Nom Prenoms")
            .sort({ DatePres: -1 })
            .lean();

        const formatted = factures.map(facture => ({
            _id: facture._id.toString(),
            CodePrestation: facture.CodePrestation || "",
            DatePres: facture.DatePres,
            PatientP: facture.PatientP || "",
            Designationtypeacte: facture.Designationtypeacte || "",
            Montanttotal: facture.Montanttotal || 0,
            PartAssuranceP: facture.PartAssuranceP || 0,
            Partassure: facture.Partassure || 0,
            TotalPaye: facture.TotalPaye || 0,
            reduction: facture.reduction || 0,
            Restapayer: facture.Restapayer || 0,
            SaisiPar: facture.SaisiPar || "",
            Numfacture: facture.Numfacture || "",
            StatutFacture: facture.StatutFacture || false,
            Modepaiement: facture.Modepaiement || "",
            // Ajouter d'autres champs si nécessaire
        }));

        return NextResponse.json(formatted);

    } catch (error: any) {
        console.error("Erreur API facturesPrescriptionListe:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des factures de prescription" },
            { status: 500 }
        );
    }
}