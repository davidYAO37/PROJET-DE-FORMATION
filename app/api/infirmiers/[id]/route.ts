import { db } from "@/db/mongoConnect";
import { Infirmier } from "@/models/infirmier";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const infirmier = await Infirmier.findById(id);
    if (!infirmier) return NextResponse.json({ error: "Infirmier non trouvé" }, { status: 404 });
    return NextResponse.json(infirmier);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await Infirmier.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Infirmier non trouvé" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur update infirmier:", error);
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await params;
  try {
    await Infirmier.findByIdAndDelete(id);
    return NextResponse.json({ message: "Infirmier supprimé" });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
