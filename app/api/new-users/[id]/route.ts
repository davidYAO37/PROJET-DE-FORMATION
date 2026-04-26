import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();
    const { id } = await params;
    const body = await req.json();

    // Validation des champs requis
    if (!body.nom || !body.prenom || !body.email || !body.type) {
      return NextResponse.json({ 
        message: "Tous les champs sont requis" 
      }, { status: 400 });
    }

    // Vérifier si l'email existe déjà (pour un autre utilisateur)
    const existingUser = await UserCollection.findOne({ 
      email: body.email, 
      _id: { $ne: id } 
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: "Cet email est déjà utilisé par un autre utilisateur" 
      }, { status: 400 });
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await UserCollection.findByIdAndUpdate(
      id,
      {
        nom: body.nom,
        prenom: body.prenom,
        email: body.email,
        type: body.type
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ 
        message: "Utilisateur non trouvé" 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser
    });

  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        message: "Cet email est déjà utilisé" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "Erreur serveur lors de la mise à jour" 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();
    const { id } = await params;

    const deletedUser = await UserCollection.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ 
        message: "Utilisateur non trouvé" 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json({ 
      message: "Erreur serveur lors de la suppression" 
    }, { status: 500 });
  }
}
