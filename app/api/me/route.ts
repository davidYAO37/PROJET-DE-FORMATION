import { NextRequest, NextResponse } from "next/server";
import { clearImpersonateCookie, getCurrentUser, getImpersonateEntrepriseId } from "@/lib/auth";
import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    await db();
    if (user.type === "adminsuper") {
      const entrepriseId = await getImpersonateEntrepriseId(req);
      if (entrepriseId) {
        const entrepriseExiste = await Entreprise.exists({ _id: entrepriseId });
        if (!entrepriseExiste) {
          const response = NextResponse.json({ success: true, user }, { status: 200 });
          clearImpersonateCookie(response);
          return response;
        }
        user.entrepriseId = entrepriseId;
      }
    } else {
      const entrepriseExiste = user.entrepriseId && await Entreprise.exists({ _id: user.entrepriseId });
      if (!entrepriseExiste) {
        const response = NextResponse.json({ message: "Entreprise associée introuvable" }, { status: 401 });
        response.cookies.set("easy_medical_token", "", { path: "/", maxAge: 0 });
        return response;
      }
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
