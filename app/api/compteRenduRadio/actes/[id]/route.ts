import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");

  try {
    const { id } = await params;

    // Rechercher l'acte par ID
    const acte = await ActeClinique.findById(id).lean();

    if (!acte) {
      return NextResponse.json(
        { error: "Acte introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(acte);
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'acte:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de l'acte" },
      { status: 500 }
    );
  }
}
