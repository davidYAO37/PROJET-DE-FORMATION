import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function GET() {
  await db();
  try {
    const medecins = await Medecin.find({});
    return NextResponse.json(medecins);
  } catch {
    return NextResponse.json({ error: "Erreur récupération médecins" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    const newMedecin = await Medecin.create(body);
    return NextResponse.json(newMedecin, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur ajout médecin" }, { status: 500 });
  }
}
