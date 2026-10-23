import { NextRequest, NextResponse } from "next/server";
import { withTenant, getTenantFilter } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "biologiste", "technicienlabo"];

export async function PUT(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");

  try {
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


    const updated = await ExamenHospitalisation.findOneAndUpdate(
      { ...getTenantFilter(context), _id: idHospitalisation, dateRemiseResultat: null },
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
        { message: "Renvoi impossible : résultat déjà remis ou examen introuvable." },
        { status: 409 }
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
