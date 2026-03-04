import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { PatientPrescription } from "@/models/PatientPrescription";

// PUT /api/patientprescriptionFacture/[id] - Mettre à jour une prescription patient
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const body = await request.json();

        console.log("🔄 PUT /api/patientprescriptionFacture/[id] - ID:", id, "Body:", body);

        const updated = await PatientPrescription.findByIdAndUpdate(id, body, { new: true });

        if (!updated) {
            console.log("❌ Prescription patient introuvable pour ID:", id);
            return NextResponse.json({
                error: "Prescription patient introuvable"
            }, { status: 404 });
        }

        console.log("✅ Prescription patient mise à jour:", updated);
        return NextResponse.json({
            success: true,
            data: updated,
            message: "Prescription patient mise à jour avec succès"
        });
    } catch (error: any) {
        console.error("Erreur PUT /api/patientprescriptionFacture/[id]:", error);
        return NextResponse.json({
            error: "Erreur lors de la mise à jour de la prescription patient",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/patientprescriptionFacture/[id] - Supprimer une prescription patient
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;

        console.log("🗑️ DELETE /api/patientprescriptionFacture/[id] - ID:", id);

        const deleted = await PatientPrescription.findByIdAndDelete(id);

        if (!deleted) {
            console.log("❌ Prescription patient introuvable pour ID:", id);
            return NextResponse.json({
                error: "Prescription patient introuvable"
            }, { status: 404 });
        }

        console.log("✅ Prescription patient supprimée:", deleted);
        return NextResponse.json({
            success: true,
            data: deleted,
            message: "Prescription patient supprimée avec succès"
        });
    } catch (error: any) {
        console.error("Erreur DELETE /api/patientprescriptionFacture/[id]:", error);
        return NextResponse.json({
            error: "Erreur lors de la suppression de la prescription patient",
            details: error.message
        }, { status: 500 });
    }
}
