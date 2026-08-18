import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "biologiste", "technicienlabo"];

export async function PUT(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");

  try {
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
        StatutLaboratoire: 2,
        DATERECEPTIONNER: now,
        Heurereception: heure,
        Receptionnerpar: receptionnerPar,
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
