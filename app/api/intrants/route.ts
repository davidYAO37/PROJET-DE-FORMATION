import { NextRequest, NextResponse } from "next/server";
import { withTenant, getTenantFilter } from "@/lib/withTenant";
import { getIntrantModels, ROLES_INTRANTS_LECTURE, ROLES_INTRANTS_PARAMETRAGE } from "@/lib/intrantsService";

const auteur = (req: NextRequest, context: any) =>
  req.headers.get("x-user-name") || context.user?.email || "Système";

// GET - Catalogue des intrants (q, categorie, actif, ids)
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { Intrant, filter } = getIntrantModels(context);

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const categorie = searchParams.get("categorie");
    const ids = searchParams.get("ids");
    const actif = searchParams.get("actif");

    const query: Record<string, any> = { ...filter };
    if (ids) query._id = { $in: ids.split(",").filter(Boolean) };
    if (categorie) query.categorie = categorie;
    if (actif !== null && actif !== "") query.actif = actif === "true";
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ designation: rx }, { reference: rx }, { sousCategorie: rx }];
    }

    const intrants = await Intrant.find(query).sort({ designation: 1 }).lean();
    const categories = await Intrant.distinct("categorie", filter);
    return NextResponse.json({ success: true, data: intrants, categories, total: intrants.length });
  } catch (error) {
    console.error("Erreur GET intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un intrant au catalogue
export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { Intrant, filter } = getIntrantModels(context);

  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const designation = String(body.designation || "").trim();
    const categorie = String(body.categorie || "").trim();
    const uniteStock = String(body.uniteStock || "").trim();

    if (!reference || !designation || !categorie || !uniteStock) {
      return NextResponse.json(
        { success: false, error: "Référence, désignation, catégorie et unité de stock sont requis." },
        { status: 400 }
      );
    }

    const existe = await Intrant.exists({ ...filter, reference });
    if (existe) {
      return NextResponse.json(
        { success: false, error: `La référence « ${reference} » existe déjà.` },
        { status: 409 }
      );
    }

    const cree = await Intrant.create({
      ...filter,
      reference,
      designation,
      categorie,
      sousCategorie: body.sousCategorie,
      uniteStock,
      conditionnement: body.conditionnement,
      qteParConditionnement: Math.max(0, Number(body.qteParConditionnement) || 1),
      seuilMinimum: Math.max(0, Number(body.seuilMinimum) || 0),
      seuilMaximum: Math.max(0, Number(body.seuilMaximum) || 0),
      suiviLot: body.suiviLot !== false,
      delaiApresOuvertureJours: Number(body.delaiApresOuvertureJours) > 0 ? Number(body.delaiApresOuvertureJours) : undefined,
      conservation: body.conservation,
      fournisseur: body.fournisseur,
      prixAchat: Math.max(0, Number(body.prixAchat) || 0),
      actif: true,
      auteurModif: auteur(req, context),
    });

    return NextResponse.json({ success: true, data: cree }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
