import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";

export async function PUT(req: NextRequest) {
  try {
    await db();
    const body = await req.json();
    const { idHospitalisation, Transferepar } = body;

    if (!idHospitalisation) {
      return NextResponse.json(
        { error: "Paramètres manquants", message: "idHospitalisation requis." },
        { status: 400 }
      );
    }

    if (!Transferepar) {
      return NextResponse.json(
        { error: "Utilisateur non fourni", message: "Transferepar requis." },
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
        StatutLaboratoire: 3,
        Datetransferbiologiste: now.toISOString(),
        Transferepar,
        dateretour: "",
        ObservationC: "",
        SignatureMed: "",
        MotifRetour: ""
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
    console.error("Erreur PUT envoyerResultat:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: String(error) },
      { status: 500 }
    );
  }
}
