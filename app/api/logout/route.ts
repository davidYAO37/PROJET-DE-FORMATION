import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Déconnexion réussie" }, { status: 200 });
    await removeAuthCookie(response);
    return response;
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
