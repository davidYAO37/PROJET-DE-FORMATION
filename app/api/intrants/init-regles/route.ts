import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { getIntrantModels, ROLES_INTRANTS_PARAMETRAGE } from "@/lib/intrantsService";
import { REGLES_COMPARAISON_DEFAUT } from "@/lib/intrantsDefaut";
import { accentInsensitiveRegex } from "@/lib/searchText";
import type { IActeClinique } from "@/models/acteclinique";

/**
 * POST - Crée les règles de comparaison par défaut (intrant ↔ analyse).
 * - L'intrant est résolu par sa référence (catalogue par défaut).
 * - Si un acte biologique (lettreCle "B") du tenant porte le nom ciblé,
 *   son idActe est stocké en plus du nom.
 * - Idempotent : une règle (intrantId + prestation) déjà existante est ignorée.
 */
export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES_INTRANTS_PARAMETRAGE);
  if (!context) return response;
  const { Intrant, RegleComparaison, filter } = getIntrantModels(context);
  const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");

  try {
    const [intrants, reglesExistantes] = await Promise.all([
      Intrant.find(filter).select("reference").lean(),
      RegleComparaison.find(filter).select("intrantId prestation").lean(),
    ]);
    const intrantParRef = new Map(intrants.map((i: any) => [i.reference, String(i._id)]));
    const deja = new Set(reglesExistantes.map((r: any) => `${r.intrantId}|${r.prestation || ""}`));

    // Actes biologiques du tenant, indexés par designation normalisée.
    const actesBio = await ActeClinique.find({ ...filter, lettreCle: "B" })
      .select("designationacte")
      .lean();
    const trouverActe = (nom: string) =>
      actesBio.find((a: any) =>
        accentInsensitiveRegex(nom).source === accentInsensitiveRegex(a.designationacte).source
      )?._id;

    let crees = 0;
    let ignores = 0;
    let intrantsManquants = 0;
    const aCreer: any[] = [];

    for (const def of REGLES_COMPARAISON_DEFAUT) {
      const intrantId = intrantParRef.get(def.referenceIntrant);
      if (!intrantId) { intrantsManquants++; continue; }
      for (const nom of def.prestations) {
        const cle = `${intrantId}|${nom}`;
        if (deja.has(cle)) { ignores++; continue; }
        deja.add(cle);
        aCreer.push({
          ...filter,
          intrantId,
          idActe: trouverActe(nom),
          prestation: nom,
          consommationTheorique: def.consommationTheorique,
          actif: true,
        });
      }
    }

    if (aCreer.length) {
      const inserees = await RegleComparaison.insertMany(aCreer);
      crees = inserees.length;
    }

    return NextResponse.json({
      success: true,
      crees,
      ignores,
      intrantsManquants,
      message: `${crees} règles créées, ${ignores} déjà présentes${intrantsManquants ? `, ${intrantsManquants} intrants par défaut absents du catalogue` : ""}.`,
    });
  } catch (error) {
    console.error("Erreur POST init règles comparaison:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
