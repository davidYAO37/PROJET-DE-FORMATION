import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import {
  dateLimiteLot,
  getIntrantModels,
  rafraichirLotsPerimes,
  ROLES_INTRANTS_LECTURE,
} from "@/lib/intrantsService";

/**
 * GET - Statistiques propres au module intrants.
 * Paramètres : dateDebut, dateFin (sur la date du bon, statut "valide").
 * Sépare clairement les utilisations (consommation) des pertes et des entrées.
 */
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { MouvementIntrant, Intrant, LotIntrant, filter } = getIntrantModels(context);

  try {
    await rafraichirLotsPerimes(context);
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const debut = searchParams.get("dateDebut");
    const fin = searchParams.get("dateFin");
    const periodStart = debut ? new Date(`${debut}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = fin ? new Date(`${fin}T23:59:59.999`) : now;
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
      return NextResponse.json({ success: false, error: "Période invalide" }, { status: 400 });
    }

    const match = { ...filter, statut: "valide", date: { $gte: periodStart, $lte: periodEnd } };

    const [parType, parMotif, parIntrant, parMois, valorisationAgg, intrantsActifs, lotsPerimes] = await Promise.all([
      // Quantités et nombre de bons par type de mouvement
      MouvementIntrant.aggregate([
        { $match: match },
        { $unwind: "$lignes" },
        {
          $group: {
            _id: "$type",
            quantite: { $sum: { $abs: "$lignes.quantite" } },
            montant: { $sum: { $multiply: [{ $abs: "$lignes.quantite" }, { $ifNull: ["$lignes.prixUnitaire", 0] }] } },
            lignes: { $sum: 1 },
          },
        },
      ]),
      // Utilisations et pertes par motif
      MouvementIntrant.aggregate([
        { $match: { ...match, type: { $in: ["utilisation", "perte"] } } },
        { $unwind: "$lignes" },
        {
          $group: {
            _id: { type: "$type", motif: { $ifNull: ["$motif", "Non renseigné"] } },
            quantite: { $sum: { $abs: "$lignes.quantite" } },
            montant: { $sum: { $multiply: [{ $abs: "$lignes.quantite" }, { $ifNull: ["$lignes.prixUnitaire", 0] }] } },
          },
        },
        { $sort: { quantite: -1 } },
      ]),
      // Consommation par intrant (utilisation vs perte)
      MouvementIntrant.aggregate([
        { $match: { ...match, type: { $in: ["utilisation", "perte"] } } },
        { $unwind: "$lignes" },
        {
          $group: {
            _id: { intrantId: "$lignes.intrantId", designation: "$lignes.designation", type: "$type" },
            quantite: { $sum: { $abs: "$lignes.quantite" } },
            montant: { $sum: { $multiply: [{ $abs: "$lignes.quantite" }, { $ifNull: ["$lignes.prixUnitaire", 0] }] } },
            unite: { $first: "$lignes.unite" },
          },
        },
      ]),
      // Série mensuelle
      MouvementIntrant.aggregate([
        { $match: match },
        { $unwind: "$lignes" },
        {
          $group: {
            _id: { mois: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
            quantite: { $sum: { $abs: "$lignes.quantite" } },
          },
        },
        { $sort: { "_id.mois": 1 } },
      ]),
      // Valorisation du stock restant
      LotIntrant.aggregate([
        { $match: { ...filter, qteRestante: { $gt: 0 } } },
        { $group: { _id: null, valeur: { $sum: { $multiply: ["$qteRestante", { $ifNull: ["$prixUnitaire", 0] }] } } } },
      ]),
      Intrant.countDocuments({ ...filter, actif: true }),
      LotIntrant.countDocuments({ ...filter, etat: "perime", qteRestante: { $gt: 0 } }),
    ]);

    const totaux = { entrees: 0, utilisations: 0, pertes: 0, ajustements: 0, coutEntrees: 0, coutUtilisations: 0, coutPertes: 0 };
    for (const t of parType) {
      const key = { entree: "entrees", utilisation: "utilisations", perte: "pertes", ajustement: "ajustements" }[t._id as string];
      if (key) {
        (totaux as any)[key] = t.quantite;
        if (t._id === "entree") totaux.coutEntrees = t.montant;
        if (t._id === "utilisation") totaux.coutUtilisations = t.montant;
        if (t._id === "perte") totaux.coutPertes = t.montant;
      }
    }

    // Fusion par intrant : { designation, unite, utilise, perdu, coutUtilise, coutPerdu }
    const parIntrantMap = new Map<string, any>();
    for (const p of parIntrant) {
      const id = String(p._id.intrantId);
      const cur = parIntrantMap.get(id) || {
        intrantId: id,
        designation: p._id.designation,
        unite: p.unite,
        utilise: 0,
        perdu: 0,
        coutUtilise: 0,
        coutPerdu: 0,
      };
      if (p._id.type === "utilisation") { cur.utilise = p.quantite; cur.coutUtilise = p.montant; }
      if (p._id.type === "perte") { cur.perdu = p.quantite; cur.coutPerdu = p.montant; }
      parIntrantMap.set(id, cur);
    }
    const parIntrantConsommation = [...parIntrantMap.values()]
      .map((i) => ({ ...i, tauxPerte: i.utilise + i.perdu > 0 ? Math.round((i.perdu / (i.utilise + i.perdu)) * 1000) / 10 : 0 }))
      .sort((a, b) => b.utilise - a.utilise);

    const serieParMois = new Map<string, any>();
    for (const m of parMois) {
      const cur = serieParMois.get(m._id.mois) || { mois: m._id.mois, entrees: 0, utilisations: 0, pertes: 0 };
      if (m._id.type === "entree") cur.entrees = m.quantite;
      if (m._id.type === "utilisation") cur.utilisations = m.quantite;
      if (m._id.type === "perte") cur.pertes = m.quantite;
      serieParMois.set(m._id.mois, cur);
    }

    return NextResponse.json({
      success: true,
      data: {
        periode: { debut: periodStart, fin: periodEnd },
        totaux,
        parMotif: parMotif.map((m) => ({ type: m._id.type, motif: m._id.motif, quantite: m.quantite, montant: Math.round(m.montant * 100) / 100 })),
        parIntrant: parIntrantConsommation,
        parMois: [...serieParMois.values()],
        valorisationStock: Math.round((valorisationAgg[0]?.valeur || 0) * 100) / 100,
        intrantsActifs,
        lotsPerimes,
      },
    });
  } catch (error) {
    console.error("Erreur GET statistiques intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
