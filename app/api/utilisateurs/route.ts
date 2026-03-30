import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";

export async function GET(req: NextRequest) {
  try {
    await db();

    // Récupérer l'ID entreprise depuis les paramètres
    const { searchParams } = new URL(req.url);
    const entrepriseId = searchParams.get('entrepriseId');

    if (!entrepriseId) {
      return NextResponse.json(
        { error: "ID entreprise requis" },
        { status: 400 }
      );
    }

    // Filtrer les utilisateurs par entrepriseId
    const utilisateurs = await UserCollection.find({ 
      entrepriseId: entrepriseId 
    })
    .select('nom prenom email type uid entrepriseId')
    .lean();

    return NextResponse.json({
      success: true,
      data: utilisateurs
    });

  } catch (error: any) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
