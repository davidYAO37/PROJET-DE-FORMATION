import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import {
  appliquerMouvement,
  genererNumeroMouvement,
  getIntrantModels,
  intrantErrorResponse,
  isObjectId,
  ROLES_INTRANTS_LECTURE,
  ROLES_INTRANTS_MOUVEMENT,
} from "@/lib/intrantsService";
import { TYPES_MOUVEMENT_INTRANT, type TypeMouvementIntrant } from "@/models/intrants/MouvementIntrant";

const auteur = (req: NextRequest, context: any) =>
  req.headers.get("x-user-name") || context.user?.email || "Système";

// GET - Historique des bons (type, statut, dateDebut/dateFin, intrantId)
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { MouvementIntrant, filter } = getIntrantModels(context);

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const statut = searchParams.get("statut");
    const intrantId = searchParams.get("intrantId");
    const debut = searchParams.get("dateDebut");
    const fin = searchParams.get("dateFin");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));

    const query: Record<string, any> = { ...filter };
    if (type && TYPES_MOUVEMENT_INTRANT.includes(type as TypeMouvementIntrant)) query.type = type;
    if (statut) query.statut = statut;
    if (intrantId && isObjectId(intrantId)) query["lignes.intrantId"] = intrantId;
    if (debut || fin) {
      const range: Record<string, Date> = {};
      if (debut) range.$gte = new Date(`${debut}T00:00:00`);
      if (fin) range.$lte = new Date(`${fin}T23:59:59.999`);
      query.date = range;
    }

    const [mouvements, total] = await Promise.all([
      MouvementIntrant.find(query).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MouvementIntrant.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: mouvements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur GET mouvements intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Créer un bon de mouvement.
 * type: "entree" | "utilisation" | "perte" | "ajustement"
 * lignes[]: { intrantId, quantite, lotId?, numeroLot?, datePeremption?, prixUnitaire?, emplacement? }
 * statut: "brouillon" (défaut) ; "valide" applique immédiatement le stock.
 */
export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_MOUVEMENT);
  if (!context) return response;
  const { MouvementIntrant, filter } = getIntrantModels(context);

  try {
    const body = await req.json();
    const type = body.type as TypeMouvementIntrant;
    if (!TYPES_MOUVEMENT_INTRANT.includes(type)) {
      return NextResponse.json({ success: false, error: "Type de mouvement invalide." }, { status: 400 });
    }
    if (!Array.isArray(body.lignes) || !body.lignes.length) {
      return NextResponse.json({ success: false, error: "Le bon doit contenir au moins une ligne." }, { status: 400 });
    }
    for (const ligne of body.lignes) {
      if (!isObjectId(ligne.intrantId)) {
        return NextResponse.json({ success: false, error: "Chaque ligne doit désigner un intrant." }, { status: 400 });
      }
      if (!Number(ligne.quantite) && Number(ligne.quantite) !== 0) {
        return NextResponse.json({ success: false, error: "Quantité invalide sur une ligne." }, { status: 400 });
      }
    }
    const statut = body.statut === "valide" ? "valide" : "brouillon";
    const nom = auteur(req, context);

    // Enrichit les lignes avec la désignation et l'unité du catalogue.
    const { Intrant } = getIntrantModels(context);
    const ids = [...new Set(body.lignes.map((l: any) => String(l.intrantId)))];
    const catalogue = await Intrant.find({ _id: { $in: ids }, ...filter }).select("designation uniteStock").lean();
    const infos = new Map(catalogue.map((i: any) => [String(i._id), i]));

    const mouvement = await MouvementIntrant.create({
      ...filter,
      numero: genererNumeroMouvement(type),
      type,
      date: body.date ? new Date(body.date) : new Date(),
      motif: body.motif,
      observation: body.observation,
      fournisseur: body.fournisseur,
      lignes: body.lignes.map((l: any) => ({
        intrantId: l.intrantId,
        lotId: isObjectId(l.lotId) ? l.lotId : undefined,
        numeroLot: l.numeroLot,
        datePeremption: l.datePeremption ? new Date(l.datePeremption) : undefined,
        emplacement: l.emplacement,
        prixUnitaire: Math.max(0, Number(l.prixUnitaire) || 0),
        quantite: Number(l.quantite),
        designation: infos.get(String(l.intrantId))?.designation || "-",
        unite: infos.get(String(l.intrantId))?.uniteStock || "",
      })),
      statut: "brouillon",
      saisiPar: nom,
    });

    if (statut === "valide") {
      try {
        const lignes = await appliquerMouvement(context, mouvement as any, nom);
        mouvement.lignes = lignes as any;
        mouvement.statut = "valide";
        mouvement.validePar = nom;
        mouvement.valideLe = new Date();
        await mouvement.save();
      } catch (err) {
        await MouvementIntrant.deleteOne({ _id: mouvement._id }).catch(() => {});
        return intrantErrorResponse(err);
      }
    }

    return NextResponse.json({ success: true, data: mouvement }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST mouvement intrant:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
