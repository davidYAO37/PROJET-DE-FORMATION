import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import {
  getIntrantModels,
  isObjectId,
  rafraichirLotsPerimes,
  ROLES_INTRANTS_LECTURE,
  ROLES_INTRANTS_MOUVEMENT,
} from "@/lib/intrantsService";

const auteur = (req: NextRequest, context: any) =>
  req.headers.get("x-user-name") || context.user?.email || "Système";

/**
 * GET - Lots d'intrants.
 * Filtres : intrantId, etat, disponibles=true (lot utilisable pour une sortie,
 * trié FEFO : date limite la plus proche en premier).
 */
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { LotIntrant, Intrant, filter } = getIntrantModels(context);

  try {
    await rafraichirLotsPerimes(context);
    const { searchParams } = new URL(req.url);
    const intrantId = searchParams.get("intrantId");
    const etat = searchParams.get("etat");
    const disponibles = searchParams.get("disponibles") === "true";

    const query: Record<string, any> = { ...filter };
    if (intrantId && isObjectId(intrantId)) query.intrantId = intrantId;
    if (disponibles) {
      query.etat = "disponible";
      query.qteRestante = { $gt: 0 };
    } else if (etat) {
      query.etat = etat;
    }

    const lots = await LotIntrant.find(query)
      .sort({ datePeremption: 1, dateLimiteOuverture: 1, dateReception: 1 })
      .limit(500)
      .lean();

    // Joindre la désignation de l'intrant pour l'affichage.
    const ids = [...new Set(lots.map((l: any) => String(l.intrantId)))];
    const intrants = await Intrant.find({ _id: { $in: ids }, ...filter }).select("designation uniteStock reference").lean();
    const noms = new Map(intrants.map((i: any) => [String(i._id), i]));

    return NextResponse.json({
      success: true,
      data: lots.map((l: any) => ({ ...l, intrant: noms.get(String(l.intrantId)) || null })),
      total: lots.length,
    });
  } catch (error) {
    console.error("Erreur GET lots intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Ouvrir un lot (date d'ouverture + limite d'utilisation) ou le bloquer/débloquer
export async function PUT(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_MOUVEMENT);
  if (!context) return response;
  const { LotIntrant, Intrant, filter } = getIntrantModels(context);

  try {
    const body = await req.json();
    const lot = await LotIntrant.findOne({ _id: body.lotId, ...filter });
    if (!lot) return NextResponse.json({ success: false, error: "Lot introuvable" }, { status: 404 });

    const update: Record<string, any> = {};
    if (body.action === "ouvrir") {
      const dateOuverture = body.dateOuverture ? new Date(body.dateOuverture) : new Date();
      update.dateOuverture = dateOuverture;
      const intrant = await Intrant.findOne({ _id: lot.intrantId, ...filter }).select("delaiApresOuvertureJours").lean<any>();
      if (intrant?.delaiApresOuvertureJours) {
        const limite = new Date(dateOuverture);
        limite.setDate(limite.getDate() + Number(intrant.delaiApresOuvertureJours));
        update.dateLimiteOuverture = limite;
      }
    } else if (body.action === "bloquer" || body.action === "debloquer") {
      if (lot.etat === "epuise" || lot.etat === "perime") {
        return NextResponse.json(
          { success: false, error: `Un lot ${lot.etat} ne peut pas être ${body.action === "bloquer" ? "bloqué" : "débloqué"}.` },
          { status: 400 }
        );
      }
      update.etat = body.action === "bloquer" ? "bloque" : "disponible";
    } else {
      return NextResponse.json({ success: false, error: "Action inconnue (ouvrir | bloquer | debloquer)." }, { status: 400 });
    }

    const maj = await LotIntrant.findOneAndUpdate({ _id: lot._id }, update, { new: true });
    return NextResponse.json({ success: true, data: maj });
  } catch (error) {
    console.error("Erreur PUT lot intrant:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
