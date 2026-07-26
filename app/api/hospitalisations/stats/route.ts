import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { ILit } from "@/models/lit";
import { IChambre } from "@/models/chambre";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection } = context;

  try {
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, "ExamenHospitalisation");
    const Lit = getTenantModel<ILit>(connection, "Lit");
    const Chambre = getTenantModel<IChambre>(connection, "Chambre");

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [
      total,
      enCours,
      sorties,
      admissionsToday,
      sortiesToday,
      totalLits,
      litsOccupes,
      totalChambres,
      chambresOccupees,
    ] = await Promise.all([
      ExamenHospitalisation.countDocuments({ statutHospitalisation: { $exists: true } }),
      ExamenHospitalisation.countDocuments({ statutHospitalisation: "en_cours" }),
      ExamenHospitalisation.countDocuments({ statutHospitalisation: "sortie" }),
      ExamenHospitalisation.countDocuments({
        statutHospitalisation: "en_cours",
        Entrele: { $gte: startOfDay, $lt: endOfDay },
      }),
      ExamenHospitalisation.countDocuments({
        statutHospitalisation: "sortie",
        SortieLe: { $gte: startOfDay, $lt: endOfDay },
      }),
      Lit.countDocuments(),
      Lit.countDocuments({ etat: "occupe" }),
      Chambre.countDocuments(),
      Chambre.countDocuments({ etat: "occupee" }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        enCours,
        sorties,
        admissionsToday,
        sortiesToday,
        lits: { total: totalLits, occupes: litsOccupes, libres: totalLits - litsOccupes },
        chambres: { total: totalChambres, occupees: chambresOccupees, libres: totalChambres - chambresOccupees },
      },
    });
  } catch (error) {
    console.error("Erreur stats hospitalisation:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
