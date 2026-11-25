import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getIntrantModels, isObjectId, ROLES_INTRANTS_PARAMETRAGE } from "@/lib/intrantsService";

// PUT - Modifier une règle de comparaison
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { RegleComparaison, filter } = getIntrantModels(context);

  try {
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, any> = {};
    if (body.idActe !== undefined) update.idActe = isObjectId(body.idActe) ? body.idActe : null;
    if (body.prestation !== undefined) update.prestation = String(body.prestation || "").trim() || null;
    if (body.familleActe !== undefined) update.familleActe = String(body.familleActe || "").trim() || null;
    if (body.consommationTheorique !== undefined) {
      if (!(Number(body.consommationTheorique) > 0)) {
        return NextResponse.json({ success: false, error: "Consommation théorique invalide." }, { status: 400 });
      }
      update.consommationTheorique = Number(body.consommationTheorique);
    }
    if (body.dateEffet !== undefined) update.dateEffet = body.dateEffet ? new Date(body.dateEffet) : null;
    if (body.actif !== undefined) update.actif = !!body.actif;

    const maj = await RegleComparaison.findOneAndUpdate({ _id: id, ...filter }, update, { new: true });
    if (!maj) return NextResponse.json({ success: false, error: "Règle introuvable" }, { status: 404 });
    return NextResponse.json({ success: true, data: maj });
  } catch (error) {
    console.error("Erreur PUT règle comparaison:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une règle (sans impact sur le stock)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { RegleComparaison, filter } = getIntrantModels(context);

  const { id } = await params;
  const supprime = await RegleComparaison.findOneAndDelete({ _id: id, ...filter });
  if (!supprime) return NextResponse.json({ success: false, error: "Règle introuvable" }, { status: 404 });
  return NextResponse.json({ success: true, message: "Règle supprimée" });
}
