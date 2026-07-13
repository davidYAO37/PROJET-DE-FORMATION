import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Facturation } from "@/models/Facturation";
import mongoose from "mongoose";

// GET /api/facturation/search
// Params: patient, codePrestation, dateDebut, dateFin, typefacture, statut, page, limit
export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);

        const patient = searchParams.get("patient") || "";
        const codePrestation = searchParams.get("codePrestation") || "";
        const dateDebut = searchParams.get("dateDebut") || "";
        const dateFin = searchParams.get("dateFin") || "";
        const typefacture = searchParams.get("typefacture") || "";
        const statut = searchParams.get("statut") || "";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

        const query: any = {};

        if (codePrestation.trim()) {
            query.CodePrestation = { $regex: codePrestation.trim(), $options: "i" };
        }

        if (patient.trim()) {
            query.PatientP = { $regex: patient.trim(), $options: "i" };
        }

        if (typefacture.trim()) {
            query.typefacture = typefacture.trim();
        }

        if (statut === "payee") {
            query.StatutFacture = true;
        } else if (statut === "nonpayee") {
            query.StatutFacture = { $ne: true };
        } else if (statut === "annulee") {
            query.factureannule = true;
        }

        if (dateDebut || dateFin) {
            query.DateFacturation = {};
            if (dateDebut) query.DateFacturation.$gte = new Date(dateDebut);
            if (dateFin) {
                const fin = new Date(dateFin);
                fin.setHours(23, 59, 59, 999);
                query.DateFacturation.$lte = fin;
            }
        }

        const total = await Facturation.countDocuments(query);
        const factures = await Facturation.find(query)
            .sort({ DateFacturation: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const data = factures.map((f) => ({
            _id: f._id.toString(),
            CodePrestation: f.CodePrestation || "",
            PatientP: f.PatientP || "",
            NomMed: f.NomMed || "",
            DatePres: f.DatePres,
            DateFacturation: f.DateFacturation,
            Designationtypeacte: f.Designationtypeacte || "",
            typefacture: f.typefacture || "",
            Montanttotal: f.Montanttotal || 0,
            PartAssuranceP: f.PartAssuranceP || 0,
            Partassure: f.Partassure || 0,
            TotalapayerPatient: f.TotalapayerPatient || 0,
            TotalPaye: f.TotalPaye || 0,
            Restapayer: f.Restapayer || 0,
            reduction: f.reduction || 0,
            tauxreduction: f.tauxreduction || 0,
            Assurance: f.Assurance || "",
            Taux: f.Taux || "",
            Numfacture: f.Numfacture || "",
            NumBon: f.NumBon || "",
            Numcarte: f.Numcarte || "",
            Modepaiement: f.Modepaiement || "",
            StatutFacture: f.StatutFacture || false,
            factureannule: f.factureannule || false,
            Ordonnerlannulation: f.Ordonnerlannulation || false,
            StatutPaiement: f.StatutPaiement || "",
            FacturePar: f.FacturePar || "",
            SaisiPar: f.SaisiPar || "",
            SOCIETE_PATIENT: f.SOCIETE_PATIENT || "",
            Souscripteur: f.Souscripteur || "",
            Heure_Facturation: f.Heure_Facturation || "",
            MontantRecu: f.MontantRecu || 0,
            MotifAnnulationFacture: f.MotifAnnulationFacture || "",
            AnnulerPar: f.AnnulerPar || "",
            Annulerle: f.Annulerle,
            idHospitalisation: f.idHospitalisation,
            IDPRESCRIPTION: f.IDPRESCRIPTION,
            IdPatient: f.IdPatient,
            IDASSURANCE: f.IDASSURANCE,
        }));

        return NextResponse.json({
            success: true,
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (e: any) {
        console.error("Erreur GET /api/facturation/search:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message },
            { status: 500 }
        );
    }
}
