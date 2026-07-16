import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
