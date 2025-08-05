import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    await db();
    const user = await req.json();

    // Vérifier si l'email existe déjà
    const exist = await UserCollection.findOne({ email: user.email });
    if (exist) {
      return NextResponse.json({ message: "Cet email est déjà enregistré" }, { status: 400 });
    }

    const newUser = new UserCollection(user);
    await newUser.save();

    return NextResponse.json({ message: "Utilisateur ajouté avec succès" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
