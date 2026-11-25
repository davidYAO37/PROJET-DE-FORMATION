import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import {
  getIntrantModels,
  isObjectId,
  ROLES_INTRANTS_LECTURE,
  ROLES_INTRANTS_PARAMETRAGE,
} from "@/lib/intrantsService";

// GET - Règles de comparaison (intrant ↔ analyse), uniquement statistiques
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { RegleComparaison, Intrant, filter } = getIntrantModels(context);

  try {
    const regles = await RegleComparaison.find(filter).sort({ createdAt: -1 }).lean();
    const ids = [...new Set(regles.map((r: any) => String(r.intrantId)))];
    const intrants = await Intrant.find({ _id: { $in: ids }, ...filter }).select("designation uniteStock reference").lean();
    const noms = new Map(intrants.map((i: any) => [String(i._id), i]));
    return NextResponse.json({
      success: true,
      data: regles.map((r: any) => ({ ...r, intrant: noms.get(String(r.intrantId)) || null })),
    });
  } catch (error) {
    console.error("Erreur GET règles comparaison:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une règle : { intrantId, idActe | prestation | familleActe, consommationTheorique }
export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { RegleComparaison, Intrant, filter } = getIntrantModels(context);

  try {
    const body = await req.json();
    if (!isObjectId(body.intrantId)) {
      return NextResponse.json({ success: false, error: "Intrant requis." }, { status: 400 });
    }
    if (!isObjectId(body.idActe) && !String(body.prestation || "").trim() && !String(body.familleActe || "").trim()) {
      return NextResponse.json(
        { success: false, error: "Ciblez une analyse : idActe, prestation ou famille d'actes." },
        { status: 400 }
      );
    }
    if (!(Number(body.consommationTheorique) > 0)) {
      return NextResponse.json(
        { success: false, error: "La consommation théorique doit être supérieure à 0." },
        { status: 400 }
      );
    }
    const intrant = await Intrant.findOne({ _id: body.intrantId, ...filter }).select("_id").lean();
    if (!intrant) return NextResponse.json({ success: false, error: "Intrant introuvable." }, { status: 404 });

    const regle = await RegleComparaison.create({
      ...filter,
      intrantId: body.intrantId,
      idActe: isObjectId(body.idActe) ? body.idActe : undefined,
      prestation: String(body.prestation || "").trim() || undefined,
      familleActe: String(body.familleActe || "").trim() || undefined,
      consommationTheorique: Number(body.consommationTheorique),
      dateEffet: body.dateEffet ? new Date(body.dateEffet) : undefined,
      actif: true,
    });
    return NextResponse.json({ success: true, data: regle }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST règle comparaison:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
