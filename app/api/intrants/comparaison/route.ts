import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { getIntrantModels, ROLES_INTRANTS_LECTURE } from "@/lib/intrantsService";
import { accentInsensitiveRegex } from "@/lib/searchText";
import type { ILignePrestation } from "@/models/lignePrestation";

/**
 * GET - Comparaison lecture seule : intrants utilisés (module) vs activité des
 * analyses (laboratoire existant). Aucune écriture dans aucun des deux modules.
 *
 * Pour chaque règle active :
 *   nbAnalyses  = Σ qte des lignes de prestation biologiques ciblées
 *   theorique   = nbAnalyses × consommationTheorique
 *   utilise     = Σ lignes "utilisation" validées de l'intrant sur la période
 *   ecart       = utilise − theorique
 */
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_LECTURE);
  if (!context) return response;
  const { RegleComparaison, Intrant, MouvementIntrant, filter } = getIntrantModels(context);
  const LignePrestation = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const debut = searchParams.get("dateDebut");
    const fin = searchParams.get("dateFin");
    const periodStart = debut ? new Date(`${debut}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = fin ? new Date(`${fin}T23:59:59.999`) : now;
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
      return NextResponse.json({ success: false, error: "Période invalide" }, { status: 400 });
    }

    const regles = await RegleComparaison.find({ ...filter, actif: true }).lean();
    const intrantIds = regles.map((r: any) => r.intrantId);
    const intrants = await Intrant.find({ _id: { $in: intrantIds }, ...filter })
      .select("designation uniteStock reference categorie")
      .lean();
    const infos = new Map(intrants.map((i: any) => [String(i._id), i]));

    // Utilisations réelles par intrant sur la période (tous intrants confondus).
    const utilisations = await MouvementIntrant.aggregate([
      { $match: { ...filter, type: "utilisation", statut: "valide", date: { $gte: periodStart, $lte: periodEnd } } },
      { $unwind: "$lignes" },
      {
        $group: {
          _id: "$lignes.intrantId",
          utilise: { $sum: { $abs: "$lignes.quantite" } },
          cout: { $sum: { $multiply: [{ $abs: "$lignes.quantite" }, { $ifNull: ["$lignes.prixUnitaire", 0] }] } },
          designation: { $first: "$lignes.designation" },
          unite: { $first: "$lignes.unite" },
        },
      },
    ]);
    const utilisePar = new Map(utilisations.map((u: any) => [String(u._id), u]));

    const lignes = await Promise.all(
      regles.map(async (r: any) => {
        // Activité laboratoire : lignes de prestation biologiques ciblées.
        const matchLigne: Record<string, any> = {
          ...filter,
          lettreCle: "B",
          dateLignePrestation: { $gte: periodStart, $lte: periodEnd },
        };
        const criteres: any[] = [];
        if (r.idActe) criteres.push({ idActe: new mongoose.Types.ObjectId(String(r.idActe)) });
        // Comparaison insensible aux accents et à la casse sur le nom d'acte.
        if (r.prestation) criteres.push({ prestation: new RegExp(`^${accentInsensitiveRegex(r.prestation).source}$`, "i") });
        if (r.familleActe) criteres.push({ familleActe: new RegExp(`^${accentInsensitiveRegex(r.familleActe).source}$`, "i") });
        if (criteres.length === 1) Object.assign(matchLigne, criteres[0]);
        else if (criteres.length > 1) matchLigne.$or = criteres;

        const [agg] = await LignePrestation.aggregate([
          { $match: matchLigne },
          { $group: { _id: null, nb: { $sum: { $ifNull: ["$qte", 1] } } } },
        ]);

        const intrant = infos.get(String(r.intrantId)) as any;
        const usage = utilisePar.get(String(r.intrantId));
        const nbAnalyses = Number(agg?.nb) || 0;
        const theorique = nbAnalyses * Number(r.consommationTheorique);
        const utilise = Number(usage?.utilise) || 0;
        const ecart = utilise - theorique;
        return {
          regleId: r._id,
          intrantId: r.intrantId,
          designation: intrant?.designation || usage?.designation || "-",
          reference: intrant?.reference,
          categorie: intrant?.categorie,
          unite: intrant?.uniteStock || usage?.unite,
          cible: r.prestation || r.familleActe || (r.idActe ? "Acte ciblé" : "-"),
          consommationTheorique: r.consommationTheorique,
          nbAnalyses,
          theorique: Math.round(theorique * 1000) / 1000,
          utilise: Math.round(utilise * 1000) / 1000,
          coutUtilise: Math.round((usage?.cout || 0) * 100) / 100,
          ecart: Math.round(ecart * 1000) / 1000,
          ecartPct: theorique > 0 ? Math.round((ecart / theorique) * 1000) / 10 : null,
        };
      })
    );

    // Intrants utilisés sur la période sans règle de comparaison.
    const avecRegle = new Set(intrantIds.map(String));
    const sansRegle = utilisations
      .filter((u: any) => !avecRegle.has(String(u._id)))
      .map((u: any) => ({ intrantId: u._id, designation: u.designation, unite: u.unite, utilise: u.utilise }));

    return NextResponse.json({
      success: true,
      data: {
        periode: { debut: periodStart, fin: periodEnd },
        base: "Lignes de prestation biologiques (lettreCle = B), quantités prescrites",
        lignes: lignes.sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart)),
        intrantsSansRegle: sansRegle,
        notes: [
          "L'écart intègre les contrôles, calibrations, reprises et pertes déclarées comme utilisations.",
          "Les motifs « contrôle qualité », « calibration » et « reprise » sont exclus du théorique.",
        ],
      },
    });
  } catch (error) {
    console.error("Erreur GET comparaison intrants:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
