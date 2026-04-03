import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { NextResponse } from "next/server";

export async function GET() {
  await db();
  try {
    const entreprises = await Entreprise.find({});
    return NextResponse.json({
      success: true,
      data: entreprises
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Erreur récupération entreprises" 
    }, { status: 500 });
  }
}
