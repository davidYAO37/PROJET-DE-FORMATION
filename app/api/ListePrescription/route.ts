// app/api/ListePrescription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prescription } from "@/models/Prescription";
import { Medecin } from "@/models/medecin";
import { Assurance } from "@/models/assurance";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get("patientId");

        if (!patientId) {
            return NextResponse.json(
                { error: "L'ID du patient est requis" },
                { status: 400 }
            );
        }

        // Rechercher d'abord par IdPatient (champ ObjectId) – c'est la valeur que nous fournissons depuis l'interface
        // Si aucune ligne n'est trouvée (par exemple parce que le champ n'existait pas sur les anciennes données),
        // essayer également de filtrer sur PatientP pour préserver la rétrocompatibilité.
        let prescriptions = await Prescription.find({ $or: [{ IdPatient: patientId }, { PatientP: patientId }] })
            .populate("IDASSURANCE", "designationassurance")
            .populate("IDMEDECIN", "nom prenoms")
            .sort({ DatePres: -1 })
            .lean();

        const formatted = prescriptions.map(prescription => ({
            _id: prescription._id.toString(),
            designation: prescription.Designation || "Non spécifié",
            montant: prescription.Montanttotal || 0,
            date: prescription.DatePres,
            statut: prescription.Payéoupas || false,
            patientId: prescription.PatientP,
            codePrestation: prescription.CodePrestation || "",
            designationTypeActe: prescription.Designation || "",
            Numfacture: prescription.Numfacture || "",
            dateDebut: prescription.DatePres,
            dateFin: prescription.DatePres,
            remarques: prescription.Rclinique || ""
        }));

        return NextResponse.json(formatted);

    } catch (error: any) {
        console.error("Erreur API ListePrescription:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des prescriptions" },
            { status: 500 }
        );
    }
}