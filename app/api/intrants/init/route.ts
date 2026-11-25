import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getIntrantModels, ROLES_INTRANTS_PARAMETRAGE } from "@/lib/intrantsService";
import { INTRANTS_DEFAUT } from "@/lib/intrantsDefaut";

const auteur = (req: NextRequest, context: any) =>
  req.headers.get("x-user-name") || context.user?.email || "Système";

/**
 * POST - Initialise le catalogue avec les intrants par défaut.
 * Idempotent : les références déjà présentes sont ignorées.
 */
export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { Intrant, filter } = getIntrantModels(context);

  try {
    const existants = await Intrant.find(filter).select("reference").lean();
    const presentes = new Set(existants.map((i: any) => i.reference));
    const nom = auteur(req, context);

    const aCreer = INTRANTS_DEFAUT.filter((i) => !presentes.has(i.reference));
    const crees = await Intrant.insertMany(
      aCreer.map((i) => ({
        ...filter,
        reference: i.reference,
        designation: i.designation,
        categorie: i.categorie,
        uniteStock: i.uniteStock,
        conditionnement: i.conditionnement,
        qteParConditionnement: i.qteParConditionnement || 1,
        seuilMinimum: i.seuilMinimum || 0,
        suiviLot: i.suiviLot !== false,
        delaiApresOuvertureJours: i.delaiApresOuvertureJours,
        conservation: i.conservation,
        qteEnStock: 0,
        prixAchat: 0,
        actif: true,
        auteurModif: nom,
      }))
    );

    return NextResponse.json({
      success: true,
      crees: crees.length,
      ignores: INTRANTS_DEFAUT.length - crees.length,
      total: INTRANTS_DEFAUT.length,
      message: crees.length
        ? `${crees.length} intrants créés (${INTRANTS_DEFAUT.length - crees.length} déjà présents).`
        : "Le catalogue par défaut est déjà initialisé.",
    });
  } catch (error) {
    console.error("Erreur POST init intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
