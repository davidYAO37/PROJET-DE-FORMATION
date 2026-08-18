import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ILignePrestation } from "@/models/lignePrestation";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "biologiste", "technicienlabo"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const LignePrestation = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");

  try {
    const { id } = await params;

    const prestations = await LignePrestation.find({
      idHospitalisation: id,
    })
      .sort({
        ordonnancementAffichage: 1,
        createdAt: 1,
      })
      .lean();
    return NextResponse.json(prestations);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
