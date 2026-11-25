import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import {
  dateLimiteLot,
  getIntrantModels,
  rafraichirLotsPerimes,
  ROLES_INTRANTS_LECTURE,
} from "@/lib/intrantsService";

const JOURS_ALERTE_PEREMPTION = 30;

/**
 * GET - Niveau de stock et alertes du module intrants.
 * - intrants : solde courant vs seuils (détail par intrant).
 * - alertes  : sous seuil, lots périmés, lots proches de la péremption.
 * - valorisation : quantité restante × prix unitaire des lots.
 */
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { Intrant, LotIntrant, filter } = getIntrantModels(context);

  try {
    await rafraichirLotsPerimes(context);
    const { searchParams } = new URL(req.url);
    const jours = Math.max(1, parseInt(searchParams.get("alerteJours") || String(JOURS_ALERTE_PEREMPTION)));
    const limite = new Date();
    limite.setDate(limite.getDate() + jours);

    const [intrants, lots] = await Promise.all([
      Intrant.find({ ...filter, actif: true }).sort({ designation: 1 }).lean(),
      LotIntrant.find({ ...filter, qteRestante: { $gt: 0 } }).lean(),
    ]);

    const parIntrant = intrants.map((i: any) => {
      const lotsIntrant = lots.filter((l: any) => String(l.intrantId) === String(i._id));
      const valeur = lotsIntrant.reduce((s: number, l: any) => s + (Number(l.qteRestante) || 0) * (Number(l.prixUnitaire) || 0), 0);
      return {
        _id: i._id,
        reference: i.reference,
        designation: i.designation,
        categorie: i.categorie,
        uniteStock: i.uniteStock,
        qteEnStock: i.qteEnStock,
        seuilMinimum: i.seuilMinimum,
        seuilMaximum: i.seuilMaximum,
        suiviLot: i.suiviLot,
        nbLots: lotsIntrant.length,
        valeurStock: Math.round(valeur * 100) / 100,
        sousSeuil: Number(i.seuilMinimum) > 0 && Number(i.qteEnStock) < Number(i.seuilMinimum),
      };
    });

    const noms = new Map(intrants.map((i: any) => [String(i._id), i.designation]));
    const formatLot = (l: any) => ({
      _id: l._id,
      intrantId: l.intrantId,
      designation: noms.get(String(l.intrantId)) || "-",
      numeroLot: l.numeroLot,
      qteRestante: l.qteRestante,
      datePeremption: l.datePeremption,
      dateLimiteOuverture: l.dateLimiteOuverture,
      dateLimite: dateLimiteLot(l),
      etat: l.etat,
      emplacement: l.emplacement,
    });

    const now = new Date();
    const perimes = lots.filter((l: any) => l.etat === "perime" || (dateLimiteLot(l) && dateLimiteLot(l)! <= now));
    const prochesPeremption = lots.filter((l: any) => {
      const d = dateLimiteLot(l);
      return l.etat === "disponible" && d && d > now && d <= limite;
    });

    return NextResponse.json({
      success: true,
      data: {
        intrants: parIntrant,
        valorisationTotale: Math.round(parIntrant.reduce((s, i) => s + i.valeurStock, 0) * 100) / 100,
        alertes: {
          sousSeuil: parIntrant.filter((i) => i.sousSeuil),
          perimes: perimes.map(formatLot),
          prochesPeremption: prochesPeremption.map(formatLot),
          alerteJours: jours,
        },
      },
    });
  } catch (error) {
    console.error("Erreur GET stock intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
