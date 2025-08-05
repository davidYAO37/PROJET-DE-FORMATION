import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { NextResponse } from "next/server";

export const POST = async (req : Request) => {
 try {

  const { uid } = await req.json();
  await db();
  const user = await UserCollection.findOne({ uid });
  if (!user) {
    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
  }
  return NextResponse.json({ profilUtilisateur: user }, { status: 200 });
  
 } catch (error) {
   console.error("Erreur lors de la connexion :", error);
   return NextResponse.json({ message: "Erreur lors de la connexion" });
 }
}
