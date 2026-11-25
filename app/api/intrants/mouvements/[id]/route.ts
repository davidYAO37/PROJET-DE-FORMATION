import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import {
  annulerMouvement,
  appliquerMouvement,
  getIntrantModels,
  intrantErrorResponse,
  ROLES_INTRANTS_LECTURE,
  ROLES_INTRANTS_MOUVEMENT,
} from "@/lib/intrantsService";

const auteur = (req: NextRequest, context: any) =>
  req.headers.get("x-user-name") || context.user?.email || "Système";

// GET - Détail d'un bon
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { MouvementIntrant, filter } = getIntrantModels(context);

  const { id } = await params;
  const mouvement = await MouvementIntrant.findOne({ _id: id, ...filter }).lean();
  if (!mouvement) return NextResponse.json({ success: false, error: "Bon introuvable" }, { status: 404 });
  return NextResponse.json({ success: true, data: mouvement });
}

/**
 * PUT - Transitions : { action: "valider" } sur un brouillon applique le stock ;
 * { action: "annuler", motifAnnulation } inverse un bon validé (traçabilité conservée).
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_MOUVEMENT);
  if (!context) return response;
  const { MouvementIntrant, filter } = getIntrantModels(context);

  try {
    const { id } = await params;
    const { action, motifAnnulation } = await req.json();
    const nom = auteur(req, context);

    const mouvement = await MouvementIntrant.findOne({ _id: id, ...filter });
    if (!mouvement) return NextResponse.json({ success: false, error: "Bon introuvable" }, { status: 404 });

    if (action === "valider") {
      if (mouvement.statut !== "brouillon") {
        return NextResponse.json({ success: false, error: "Seul un brouillon peut être validé." }, { status: 400 });
      }
      const lignes = await appliquerMouvement(context, mouvement, nom).catch((err) => {
        throw err;
      });
      mouvement.lignes = lignes as any;
      mouvement.statut = "valide";
      mouvement.validePar = nom;
      mouvement.valideLe = new Date();
      await mouvement.save();
      return NextResponse.json({ success: true, data: mouvement });
    }

    if (action === "annuler") {
      if (mouvement.statut === "annule") {
        return NextResponse.json({ success: false, error: "Ce bon est déjà annulé." }, { status: 400 });
      }
      if (mouvement.statut === "valide") {
        if (!String(motifAnnulation || "").trim()) {
          return NextResponse.json(
            { success: false, error: "Le motif d'annulation est obligatoire." },
            { status: 400 }
          );
        }
        try {
          await annulerMouvement(context, mouvement, nom);
        } catch (err) {
          return intrantErrorResponse(err);
        }
      }
      mouvement.statut = "annule";
      mouvement.annulePar = nom;
      mouvement.annuleLe = new Date();
      mouvement.motifAnnulation = motifAnnulation;
      await mouvement.save();
      return NextResponse.json({ success: true, data: mouvement });
    }

    return NextResponse.json({ success: false, error: "Action inconnue (valider | annuler)." }, { status: 400 });
  } catch (error) {
    console.error("Erreur PUT mouvement intrant:", error);
    if ((error as any)?.name === "StockIntrantInsuffisantError") return intrantErrorResponse(error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
