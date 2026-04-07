import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const entrepriseId = searchParams.get("entrepriseId");

    let medecins;
    if (entrepriseId) {
      medecins = await Medecin.find({ entrepriseId });
    } else {
      medecins = await Medecin.find({});
    }
    
    return NextResponse.json(medecins);
  } catch (error) {
    console.error('Erreur API médecins:', error);
    return NextResponse.json({ error: "Erreur récupération médecins" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    const newMedecin = await Medecin.create(body);
    return NextResponse.json(newMedecin, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout médecin:", error);
    return NextResponse.json({ error: "Erreur ajout médecin" }, { status: 500 });
  }
}
