import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const medecin = await Medecin.findById(id);
    if (!medecin) return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    return NextResponse.json(medecin);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await Medecin.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    await Medecin.findByIdAndDelete(id);
    return NextResponse.json({ message: "Médecin supprimé" });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
