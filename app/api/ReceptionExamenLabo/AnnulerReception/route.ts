import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";

export async function PUT(req: NextRequest) {
  try {
    await db();
    const body = await req.json();
    const { idHospitalisation, receptionnerPar } = body;

    if (!idHospitalisation) {
      return NextResponse.json(
        { error: "Paramètres manquants", message: "idHospitalisation requis." },
        { status: 400 }
      );
    }

    if (!receptionnerPar) {
      return NextResponse.json(
        { error: "Utilisateur non fourni", message: "receptionnerPar requis." },
        { status: 400 }
      );
    }

    const now = new Date();
    const heure = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const updated = await ExamenHospitalisation.findByIdAndUpdate(
      idHospitalisation,
      {
        StatutLaboratoire: 1,
        DATERECEPTIONNER: "",
        Heurereception: "",
        Receptionnerpar: "",
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Document non trouvé", message: `Aucun examen avec l'ID ${idHospitalisation}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PUT receptionner:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: String(error) },
      { status: 500 }
    );
  }
}
