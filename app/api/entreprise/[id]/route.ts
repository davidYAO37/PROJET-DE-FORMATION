import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const entreprise = await Entreprise.findById(id);
    if (!entreprise) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    return NextResponse.json(entreprise);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const body = await req.json();
    console.log("Données reçues pour modification entreprise:", body);
    const updated = await Entreprise.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    console.log("Entreprise modifiée:", updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur update entreprise:", error);
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    await Entreprise.findByIdAndDelete(id);
    return NextResponse.json({ message: "Entreprise supprimée" });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
