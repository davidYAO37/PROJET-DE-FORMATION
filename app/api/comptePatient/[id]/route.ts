import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ComptePatient } from "@/models/ComptePatient";
import { Patient } from "@/models/patient";
import mongoose from "mongoose";

// GET /api/comptePatient/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;

        const compte = await ComptePatient.findById(id)
            .populate("IDPARTIENT", "Nom Prenoms Contact Code_dossier ProvisionClient")
            .lean();
        if (!compte) {
            return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: compte });
    } catch (error: any) {
        console.error("Erreur GET /api/comptePatient/[id]:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}

// PUT /api/comptePatient/[id] - Modifier un mouvement et réajuster le compte patient
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const body = await req.json();

        const existing = await ComptePatient.findById(id);
        if (!existing) {
            return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 });
        }

        const oldMontant = existing.MontantClient || 0;
        const typeCompte = body.TypeCompte || existing.TypeCompte || "Paiement";

        // Le montant saisi est toujours positif; on applique le signe selon le type
        const saisieMontant = body.MontantClient !== undefined ? Number(body.MontantClient) : Math.abs(oldMontant);
        if (isNaN(saisieMontant) || saisieMontant < 0) {
            return NextResponse.json({ error: "Le montant doit être un nombre positif" }, { status: 400 });
        }

        const newMontant = typeCompte === "Remboursement" ? -saisieMontant : saisieMontant;
        const diff = newMontant - oldMontant;

        const updateData: any = {};
        if (body.DateAjout) updateData.DateAjout = new Date(body.DateAjout);
        if (body.MontantClient !== undefined || body.TypeCompte !== undefined) updateData.MontantClient = newMontant;
        if (body.TypeCompte !== undefined) updateData.TypeCompte = typeCompte;
        if (body.ModePaiement !== undefined) updateData.ModePaiement = body.ModePaiement;
        if (body.RecuDe !== undefined) updateData.RecuDe = body.RecuDe;
        if (body.RecuPar !== undefined) updateData.RecuPar = body.RecuPar;
        if (body.MotifCompte !== undefined) updateData.MotifCompte = body.MotifCompte;
        if (body.entrepriseId !== undefined) updateData.entrepriseId = body.entrepriseId;

        const updated = await ComptePatient.findByIdAndUpdate(id, updateData, { new: true });

        // Réajuster le compte provision du patient
        await Patient.findByIdAndUpdate(
            existing.IDPARTIENT,
            { $inc: { ProvisionClient: diff } },
            { new: true }
        );

        return NextResponse.json({ success: true, data: updated, message: "Mouvement modifié avec succès" });
    } catch (error: any) {
        console.error("Erreur PUT /api/comptePatient/[id]:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}

// DELETE /api/comptePatient/[id] - Supprimer un mouvement et réajuster le compte patient
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;

        const compte = await ComptePatient.findById(id);
        if (!compte) {
            return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 });
        }

        const montant = compte.MontantClient || 0;

        await ComptePatient.findByIdAndDelete(id);

        // Réajuster le compte provision du patient (on retire le montant précédemment ajouté)
        await Patient.findByIdAndUpdate(
            compte.IDPARTIENT,
            { $inc: { ProvisionClient: -montant } },
            { new: true }
        );

        return NextResponse.json({ success: true, message: "Mouvement supprimé avec succès" });
    } catch (error: any) {
        console.error("Erreur DELETE /api/comptePatient/[id]:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}
