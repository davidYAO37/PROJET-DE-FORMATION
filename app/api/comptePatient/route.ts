import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ComptePatient } from "@/models/ComptePatient";
import { Patient } from "@/models/patient";
import mongoose from "mongoose";

// GET /api/comptePatient?IDPARTIENT=xxx
export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const IDPARTIENT = searchParams.get("IDPARTIENT");

        const query: any = {};
        if (IDPARTIENT) query.IDPARTIENT = IDPARTIENT;

        const comptes = await ComptePatient.find(query)
            .populate("IDPARTIENT", "Nom Prenoms Contact Code_dossier ProvisionClient")
            .sort({ DateAjout: -1 })
            .lean();

        return NextResponse.json({ success: true, data: comptes });
    } catch (error: any) {
        console.error("Erreur GET /api/comptePatient:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}

// POST /api/comptePatient - Créer un mouvement de caution et mettre à jour le patient
export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();

        if (!body.IDPARTIENT) {
            return NextResponse.json({ error: "IDPARTIENT est requis" }, { status: 400 });
        }
        // Validation : montant saisi obligatoire
        if (body.MontantClient === undefined || body.MontantClient === null || body.MontantClient === "") {
            return NextResponse.json({ error: "Ce montant ne peut pas être pris en compte" }, { status: 400 });
        }

        const saisieMontant = Number(body.MontantClient);
        if (isNaN(saisieMontant) || saisieMontant <= 0) {
            return NextResponse.json({ error: "Le montant doit être un nombre positif" }, { status: 400 });
        }

        // SEL_Sélecteur : 1 = PAIEMENT, 2 = REMBOURSEMENT
        const typeCompte = body.TypeCompte === "Remboursement" ? "Remboursement" : "Paiement";
        const montantCo = typeCompte === "Remboursement" ? -saisieMontant : saisieMontant;

        const compteData: any = {
            DateAjout: body.DateAjout ? new Date(body.DateAjout) : new Date(),
            MontantClient: montantCo,
            TypeCompte: typeCompte,
            ModePaiement: body.ModePaiement || "",
            RecuDe: body.RecuDe || "",
            IDPARTIENT: new mongoose.Types.ObjectId(body.IDPARTIENT),
            RecuPar: body.RecuPar || "",
            MotifCompte: body.MotifCompte || "",
        };
        if (body.entrepriseId) compteData.entrepriseId = body.entrepriseId;

        const newCompte = await ComptePatient.create(compteData);

        // Mise à jour du compte provision du patient
        await Patient.findByIdAndUpdate(
            body.IDPARTIENT,
            { $inc: { ProvisionClient: montantCo } },
            { new: true }
        );

        return NextResponse.json({ success: true, data: newCompte, message: "Mouvement de caution créé avec succès" }, { status: 201 });
    } catch (error: any) {
        console.error("Erreur POST /api/comptePatient:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}
