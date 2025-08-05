import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const patient = await Patient.findById(id);
    if (!patient) return NextResponse.json({ error: "Patient non trouvé" }, { status: 404 });
    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const body = await req.json();
    const updatedPatient = await Patient.findByIdAndUpdate(id, body, { new: true });
    if (!updatedPatient) return NextResponse.json({ error: "Patient non trouvé" }, { status: 404 });
    return NextResponse.json(updatedPatient);
  } catch (error) {
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    await Patient.findByIdAndDelete(id);
    return NextResponse.json({ message: "Patient supprimé" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}


/* import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { NextResponse } from "next/server";

export async function PUT(req: Request, {params}: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;

  const body = await req.json();

   try {
      const patient = await Patient.findByIdAndUpdate(id, body, { new: true });
      return NextResponse.json({message: "ok", patient});
    } catch (error) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour" });
    }

}

export async function DELETE(req: Request, {params}: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;

   try {
     await Patient.findByIdAndDelete(id);
      return NextResponse.json({message: "ok"});
    } catch (error) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour" });
    }
}
 */