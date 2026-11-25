import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getIntrantModels, ROLES_INTRANTS_LECTURE, ROLES_INTRANTS_PARAMETRAGE } from "@/lib/intrantsService";

const auteur = (req: NextRequest, context: any) =>
  req.headers.get("x-user-name") || context.user?.email || "Système";

// GET - Détail d'un intrant + ses lots
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { Intrant, LotIntrant, filter } = getIntrantModels(context);

  try {
    const { id } = await params;
    const intrant = await Intrant.findOne({ _id: id, ...filter }).lean();
    if (!intrant) return NextResponse.json({ success: false, error: "Intrant introuvable" }, { status: 404 });
    const lots = await LotIntrant.find({ intrantId: id, ...filter }).sort({ datePeremption: 1, dateReception: -1 }).lean();
    return NextResponse.json({ success: true, data: intrant, lots });
  } catch (error) {
    console.error("Erreur GET intrant:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Modifier la fiche catalogue (jamais qteEnStock : passer par les mouvements)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { Intrant, filter } = getIntrantModels(context);

  try {
    const { id } = await params;
    const body = await req.json();

    delete body._id;
    delete body.qteEnStock;
    delete body.entrepriseId;

    if (body.reference) {
      const autre = await Intrant.findOne({ ...filter, reference: String(body.reference).trim(), _id: { $ne: id } });
      if (autre) {
        return NextResponse.json(
          { success: false, error: `La référence « ${body.reference} » est déjà utilisée.` },
          { status: 409 }
        );
      }
    }

    const champs = [
      "reference", "designation", "categorie", "sousCategorie", "uniteStock",
      "conditionnement", "conservation", "fournisseur",
    ];
    const update: Record<string, any> = { auteurModif: auteur(req, context) };
    for (const champ of champs) if (body[champ] !== undefined) update[champ] = body[champ];
    for (const champ of ["qteParConditionnement", "seuilMinimum", "seuilMaximum", "prixAchat", "delaiApresOuvertureJours"]) {
      if (body[champ] !== undefined) update[champ] = Math.max(0, Number(body[champ]) || 0);
    }
    if (body.suiviLot !== undefined) update.suiviLot = !!body.suiviLot;
    if (body.actif !== undefined) update.actif = !!body.actif;

    const maj = await Intrant.findOneAndUpdate({ _id: id, ...filter }, update, { new: true });
    if (!maj) return NextResponse.json({ success: false, error: "Intrant introuvable" }, { status: 404 });
    return NextResponse.json({ success: true, data: maj });
  } catch (error) {
    console.error("Erreur PUT intrant:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Désactive l'intrant (suppression physique seulement sans stock ni mouvement)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { Intrant, MouvementIntrant, filter } = getIntrantModels(context);

  try {
    const { id } = await params;
    const intrant = await Intrant.findOne({ _id: id, ...filter });
    if (!intrant) return NextResponse.json({ success: false, error: "Intrant introuvable" }, { status: 404 });

    const aDesMouvements = await MouvementIntrant.exists({ ...filter, "lignes.intrantId": id });
    if (aDesMouvements || Number(intrant.qteEnStock) > 0) {
      intrant.actif = false;
      intrant.auteurModif = auteur(req, context);
      await intrant.save();
      return NextResponse.json({ success: true, data: intrant, archived: true });
    }

    await Intrant.deleteOne({ _id: id, ...filter });
    return NextResponse.json({ success: true, message: "Intrant supprimé" });
  } catch (error) {
    console.error("Erreur DELETE intrant:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
