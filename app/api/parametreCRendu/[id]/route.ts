import { NextRequest, NextResponse } from "next/server";
import { ParametreCRendu } from "@/models/ParametreCRendu";
import { db } from "@/db/mongoConnect";

// PUT - Mettre à jour un paramètre de compte rendu
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();

    const { id } = await params;

    const body = await request.json();
    const { LettreCle, Date: dateParam, AjouterPar, HeureAjoute } = body;

    // Vérifier si le paramètre existe
    const parametre = await ParametreCRendu.findById(id);

    if (!parametre) {
      return NextResponse.json(
        { error: "Paramètre de compte rendu non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour les champs
    if (LettreCle !== undefined) parametre.LettreCle = LettreCle;
    if (dateParam !== undefined) parametre.Date = new Date(dateParam);
    if (AjouterPar !== undefined) parametre.AjouterPar = AjouterPar;
    if (HeureAjoute !== undefined) parametre.HeureAjoute = HeureAjoute;

    await parametre.save();

    return NextResponse.json(
      {
        message: "Paramètre de compte rendu mis à jour avec succès",
        data: parametre,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "Erreur lors de la mise à jour du paramètre de compte rendu:",
      error
    );

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du paramètre de compte rendu" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un paramètre de compte rendu
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();

    const { id } = await params;

    // Vérifier si le paramètre existe
    const parametre = await ParametreCRendu.findById(id);

    if (!parametre) {
      return NextResponse.json(
        { error: "Paramètre de compte rendu non trouvé" },
        { status: 404 }
      );
    }

    await ParametreCRendu.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Paramètre de compte rendu supprimé avec succès" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "Erreur lors de la suppression du paramètre de compte rendu:",
      error
    );

    return NextResponse.json(
      { error: "Erreur lors de la suppression du paramètre de compte rendu" },
      { status: 500 }
    );
  }
}