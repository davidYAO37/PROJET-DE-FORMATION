import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const entrepriseId = searchParams.get("entrepriseId");

    console.log('API médecins - entrepriseId:', entrepriseId);

    let medecins;
    if (entrepriseId) {
      console.log('Recherche des médecins avec entrepriseId:', entrepriseId);
      medecins = await Medecin.find({ entrepriseId });
    } else {
      console.log('Recherche de tous les médecins');
      medecins = await Medecin.find({});
    }
    
    console.log('Nombre de médecins trouvés:', medecins.length);
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
    console.log("Données reçues pour ajout médecin:", body);
    const newMedecin = await Medecin.create(body);
    console.log("Médecin créé:", newMedecin);
    return NextResponse.json(newMedecin, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout médecin:", error);
    return NextResponse.json({ error: "Erreur ajout médecin" }, { status: 500 });
  }
}
