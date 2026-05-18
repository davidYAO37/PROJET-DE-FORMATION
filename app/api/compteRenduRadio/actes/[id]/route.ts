import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db();
    const { id } = await params;

    // Rechercher l'acte par ID
    const acte = await ActeClinique.findById(id).lean();

    if (!acte) {
      return NextResponse.json(
        { error: "Acte introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(acte);
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'acte:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de l'acte" },
      { status: 500 }
    );
  }
}
