import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user: currentUser, error } = await requireAuth(req, ["admin","caisse"]);
    if (error) return error;

    await db();

    // Récupérer l'ID entreprise depuis les paramètres
    const { searchParams } = new URL(req.url);
    let entrepriseId = searchParams.get('entrepriseId');

    // Un admin normal ne peut voir que les utilisateurs de sa propre entreprise
    if (currentUser!.type !== "adminsuper") {
      entrepriseId = currentUser!.entrepriseId || null;
    }

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
