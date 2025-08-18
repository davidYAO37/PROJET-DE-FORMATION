export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await db();
  const { id } = await context.params;
  try {
    const deleted = await Patient.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Patient non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ message: "Patient supprimé" }, { status: 200 });
  } catch (error) {
    console.error('Erreur API DELETE /api/patients/[id]:', error);
    return NextResponse.json({ message: "Erreur lors de la suppression", error: String(error) }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import mongoose from "mongoose";
import { Patient } from "@/models/patient";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await db();
  const { id } = await context.params;

  try {
    const body = await req.json();

    // Gestion robuste du champ assurance
    if (body.typevisiteur === 'Non Assuré' || !body.assurance) {
      delete body.assurance;
    } else if (typeof body.assurance === 'string' && body.assurance !== '') {
      try {
        body.assurance = new mongoose.Types.ObjectId(body.assurance);
      } catch {
        delete body.assurance;
      }
    }

    // Nettoyage des champs optionnels si Non Assuré
    if (body.typevisiteur === 'Non Assuré') {
      body.tauxassurance = undefined;
      body.matriculepatient = '';
    }

    const updatedPatient = await Patient.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedPatient) {
      return NextResponse.json(
        { message: "Patient non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPatient, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API PUT /api/patients/[id]:', error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour", error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
