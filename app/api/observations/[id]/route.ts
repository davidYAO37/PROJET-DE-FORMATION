import { db } from "@/db/mongoConnect";
import { ObservationHospit } from "@/models/ObservationHospit";
import { NextResponse, NextRequest } from "next/server";
import { Types } from "mongoose";

// PUT: Mettre à jour une observation existante
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await db();
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID observation invalide" }, { status: 400 });
    }

    const body = await req.json();
    const existing = await ObservationHospit.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Observation introuvable" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (body.Patient) {
      if (!Types.ObjectId.isValid(body.Patient)) {
        return NextResponse.json({ error: "Patient ID invalide" }, { status: 400 });
      }
      updateData.Patient = new Types.ObjectId(body.Patient);
    }

    if (body.Hospitalisation) {
      if (!Types.ObjectId.isValid(body.Hospitalisation)) {
        return NextResponse.json({ error: "Hospitalisation ID invalide" }, { status: 400 });
      }
      updateData.Hospitalisation = new Types.ObjectId(body.Hospitalisation);
    }

    if (body.Date !== undefined) {
      updateData.Date = new Date(body.Date);
    }

    const stringFields = [
      "Heure", "ObservationC", "Poids", "Temperature", "Tension",
      "Glycemie", "TailleCons", "Code_dossier", "CodePrestation",
      "Intervenant", "entrepriseId"
    ];
    stringFields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== null) {
        updateData[field] = body[field];
      }
    });

    const updated = await ObservationHospit.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("Patient", "Nom Prenoms Code_dossier")
      .populate("Hospitalisation", "PatientP Chambre Entrele Designationtypeacte")
      .lean();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PUT observation:", error);
    return NextResponse.json(
      { error: "Erreur mise à jour observation: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer une observation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await db();
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID observation invalide" }, { status: 400 });
    }

    const existing = await ObservationHospit.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Observation introuvable" }, { status: 404 });
    }

    await ObservationHospit.findByIdAndDelete(id);
    return NextResponse.json({ message: "Observation supprimée" });
  } catch (error) {
    console.error("Erreur DELETE observation:", error);
    return NextResponse.json(
      { error: "Erreur suppression observation: " + (error as Error).message },
      { status: 500 }
    );
  }
}
