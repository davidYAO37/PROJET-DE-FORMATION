import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getTenantModel } from "@/lib/tenantModels";
import { getTenantFilter, type TenantContext } from "@/lib/withTenant";
import type { IStock } from "@/models/Stock";
import type { IPharmacie } from "@/models/Pharmacie";
import type { IEntreeStock } from "@/models/EntreeStock";
import type { ISortieStock } from "@/models/SortieStock";

/** Rôles autorisés à vendre (sorties caisse). */
export const ROLES_VENTE = ["admin", "pharmacien", "caisse"];
/** Rôles autorisés aux mouvements pharmacie (entrées, sorties manuelles, achats, inventaire). */
export const ROLES_MOUVEMENT_PHARMACIE = ["admin", "pharmacien"];

export class StockInsuffisantError extends Error {
  constructor(
    public medicament: string,
    public disponible: number,
    public demande: number
  ) {
    super(`Stock insuffisant pour « ${medicament} » : disponible ${disponible}, demandé ${demande}.`);
    this.name = "StockInsuffisantError";
  }
}

/** Réponse HTTP standard pour une erreur de stock (409) ou autre (400). */
export function stockErrorResponse(err: any) {
  if (err instanceof StockInsuffisantError) {
    return NextResponse.json(
      { error: err.message, code: "STOCK_INSUFFISANT", medicament: err.medicament, disponible: err.disponible, demande: err.demande },
      { status: 409 }
    );
  }
  return NextResponse.json({ error: err?.message || "Erreur de stock" }, { status: 400 });
}

const isObjectId = (id: unknown): id is string =>
  typeof id === "string" ? mongoose.Types.ObjectId.isValid(id) : !!id && mongoose.Types.ObjectId.isValid(String(id));

export const idValide = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" && v !== "undefined" && v !== "null";

/** Nettoie les champs ObjectId optionnels envoyés par la caisse. */
export function nettoyerSortieCaisse(body: Record<string, any>) {
  const data: Record<string, any> = { ...body };
  // Indicateur de vente « intégrée » : lu par la route, jamais enregistré tel quel
  delete data.StockNegatifAutorise;
  delete data.QteManquante;
  if (!idValide(body.Prescription)) delete data.Prescription;
  if (!idValide(body.Patient)) delete data.Patient;
  if (!idValide(body.IDMEDICAMENT)) delete data.IDMEDICAMENT;
  return data;
}

export function getStockModels(context: TenantContext) {
  return {
    Stock: getTenantModel<IStock>(context.connection, "Stock"),
    Pharmacie: getTenantModel<IPharmacie>(context.connection, "Pharmacie"),
    EntreeStock: getTenantModel<IEntreeStock>(context.connection, "EntreeStock"),
    SortieStock: getTenantModel<ISortieStock>(context.connection, "SortieStock"),
    filter: getTenantFilter(context),
  };
}

export type ModeVente = "DETAIL" | "BOITE";

/** Convertit une quantité saisie (boîtes ou unités) en unités de stock. */
export async function convertirEnUnites(
  context: TenantContext,
  idMedicament: unknown,
  quantite: unknown,
  modeVente?: unknown
) {
  const { Pharmacie } = getStockModels(context);
  const med = isObjectId(idMedicament) ? await Pharmacie.findById(String(idMedicament)).lean<IPharmacie>() : null;
  const qteParCond = Number(med?.QteParConditionnement) || 1;
  const mode: ModeVente = modeVente === "BOITE" ? "BOITE" : "DETAIL";
  const qteSaisie = Math.max(0, Number(quantite) || 0);
  return {
    med,
    mode,
    qteParCond,
    qteUnites: mode === "BOITE" ? qteSaisie * qteParCond : qteSaisie,
    qteConditionnement: mode === "BOITE" ? qteSaisie : undefined,
  };
}

interface AjusterStockInput {
  idMedicament?: unknown;
  reference?: string;
  medicament?: string;
  /** Variation du stock physique en unités (négatif = sortie). */
  delta: number;
  /** Variation optionnelle du stock virtuel (convention caisse : + quand on vend). */
  deltaVirtuel?: number;
  auteur?: string;
  /** Seuils à enregistrer s'ils sont fournis (> 0 ou explicitement 0). */
  seuils?: { QteMinimum?: number; QteMaximum?: number };
  /**
   * Sortie autorisée même si le stock est insuffisant : le stock devient négatif
   * (quantité due aux patients). Réservé aux ventes caisse « intégrées » explicitement.
   */
  autoriserNegatif?: boolean;
}

/** Quantité d'une sortie qui n'était pas en stock (0 si le stock suffisait). */
export function quantiteManquante(stockApres: number, sortie: number) {
  const avant = stockApres + sortie;
  return sortie - Math.min(Math.max(avant, 0), sortie);
}

/**
 * Applique une variation de stock de manière atomique.
 * - delta < 0 : refuse si le stock disponible est insuffisant (StockInsuffisantError).
 * - delta > 0 : crée la ligne de stock si elle n'existe pas encore.
 * Recherche par IDMEDICAMENT, puis par référence pour les anciens stocks sans ID.
 */
export async function ajusterStock(context: TenantContext, input: AjusterStockInput) {
  const { Stock, filter } = getStockModels(context);
  const delta = Number(input.delta) || 0;
  const idMed = isObjectId(input.idMedicament) ? String(input.idMedicament) : null;
  const reference = (input.reference || "").trim();
  const nom = input.medicament || reference || "médicament";

  const set: Record<string, any> = { DateModif: new Date(), AuteurModif: input.auteur || "Système" };
  if (input.seuils?.QteMinimum !== undefined) set.QteMinimum = Number(input.seuils.QteMinimum) || 0;
  if (input.seuils?.QteMaximum !== undefined) set.QteMaximum = Number(input.seuils.QteMaximum) || 0;
  const inc: Record<string, number> = { QteEnStock: delta };
  if (input.deltaVirtuel) inc.QteStockVirtuel = input.deltaVirtuel;

  let cible: Record<string, any> | null = idMed ? { ...filter, IDMEDICAMENT: idMed } : null;
  if (!cible || !(await Stock.exists(cible))) {
    const parRef = reference ? await Stock.findOne({ ...filter, Reference: reference }).select("_id IDMEDICAMENT").lean<any>() : null;
    // La référence ne sert de repli que si elle ne désigne pas un autre médicament
    if (parRef && (!idMed || !parRef.IDMEDICAMENT || String(parRef.IDMEDICAMENT) === idMed)) {
      cible = { _id: parRef._id };
      if (idMed && !parRef.IDMEDICAMENT) set.IDMEDICAMENT = idMed;
    }
  }

  if (delta < 0 && input.autoriserNegatif) {
    // Stock négatif autorisé : décrément sans condition (ligne de stock créée si absente)
    if (!cible) {
      if (!idMed) throw new Error(`Impossible de créer le stock de « ${nom} » sans IDMEDICAMENT.`);
      cible = { ...filter, IDMEDICAMENT: idMed };
    }
    const setOnInsert: Record<string, any> = { Reference: reference, Medicament: input.medicament || "", QteMinimum: 0, QteMaximum: 0 };
    if (!inc.QteStockVirtuel) setOnInsert.QteStockVirtuel = 0;
    return Stock.findOneAndUpdate(cible, { $inc: inc, $set: set, $setOnInsert: setOnInsert }, { new: true, upsert: true });
  }

  if (delta < 0) {
    const besoin = -delta;
    const updated = cible
      ? await Stock.findOneAndUpdate({ ...cible, QteEnStock: { $gte: besoin } }, { $inc: inc, $set: set }, { new: true })
      : null;
    if (!updated) {
      const actuel = cible ? await Stock.findOne(cible).select("QteEnStock").lean<any>() : null;
      throw new StockInsuffisantError(nom, Number(actuel?.QteEnStock) || 0, besoin);
    }
    return updated;
  }

  if (!cible) {
    if (!idMed) throw new Error(`Impossible de créer le stock de « ${nom} » sans IDMEDICAMENT.`);
    cible = { ...filter, IDMEDICAMENT: idMed };
  }
  // entrepriseId (connexion partagée) est repris automatiquement depuis le filtre lors de l'upsert
  const setOnInsert: Record<string, any> = { Reference: reference, Medicament: input.medicament || "" };
  for (const k of Object.keys(set)) delete setOnInsert[k];
  if (!("QteMinimum" in set)) setOnInsert.QteMinimum = 0;
  if (!("QteMaximum" in set)) setOnInsert.QteMaximum = 0;
  if (!inc.QteStockVirtuel) setOnInsert.QteStockVirtuel = 0;
  return Stock.findOneAndUpdate(cible, { $inc: inc, $set: set, $setOnInsert: setOnInsert }, { new: true, upsert: true });
}

/**
 * Vérifie qu'un ensemble de variations est applicable avant de toucher au stock
 * (utile pour les opérations multi-lignes : tout ou rien).
 */
export async function verifierDisponibilites(
  context: TenantContext,
  variations: { idMedicament?: unknown; reference?: string; medicament?: string; delta: number }[]
) {
  const { Stock, filter } = getStockModels(context);
  const parMed = new Map<string, { medicament: string; reference?: string; delta: number }>();
  for (const v of variations) {
    const key = isObjectId(v.idMedicament) ? String(v.idMedicament) : `ref:${v.reference || ""}`;
    const cur = parMed.get(key) || { medicament: v.medicament || v.reference || "médicament", reference: v.reference, delta: 0 };
    cur.delta += Number(v.delta) || 0;
    parMed.set(key, cur);
  }
  for (const [key, v] of parMed) {
    if (v.delta >= 0) continue;
    const q = key.startsWith("ref:") ? { ...filter, Reference: key.slice(4) } : { ...filter, IDMEDICAMENT: key };
    const stock = await Stock.findOne(q).select("QteEnStock").lean<any>();
    const dispo = Number(stock?.QteEnStock) || 0;
    if (dispo < -v.delta) throw new StockInsuffisantError(v.medicament, dispo, -v.delta);
  }
}

const seuilsFournis = (data: { QteMinimum?: unknown; QteMaximum?: unknown }) => {
  const seuils: { QteMinimum?: number; QteMaximum?: number } = {};
  if (Number(data.QteMinimum) > 0) seuils.QteMinimum = Number(data.QteMinimum);
  if (Number(data.QteMaximum) > 0) seuils.QteMaximum = Number(data.QteMaximum);
  return seuils;
};

/**
 * Enregistre une entrée en stock (quantité déjà en unités) et incrémente le stock.
 * `majPrix` : met aussi à jour les prix d'achat/vente du médicament (cas des achats).
 */
export async function enregistrerEntree(context: TenantContext, data: Record<string, any>, opts: { majPrix?: boolean } = {}) {
  const { EntreeStock, Pharmacie, filter } = getStockModels(context);
  const qte = Number(data.Quantite) || 0;
  if (qte <= 0) throw new Error(`La quantité de « ${data.Medicament || data.Reference || "médicament"} » doit être supérieure à 0.`);

  await ajusterStock(context, {
    idMedicament: data.IDMEDICAMENT,
    reference: data.Reference,
    medicament: data.Medicament,
    delta: qte,
    auteur: data.SaisiPar,
    seuils: seuilsFournis(data),
  });

  let entree;
  try {
    entree = await EntreeStock.create({ ...data, ...filter, Quantite: qte });
  } catch (e) {
    await ajusterStock(context, { idMedicament: data.IDMEDICAMENT, reference: data.Reference, delta: -qte, auteur: data.SaisiPar }).catch(() => {});
    throw e;
  }

  if (opts.majPrix && isObjectId(data.IDMEDICAMENT)) {
    const prix: Record<string, number> = {};
    if (Number(data.PrixAchat) > 0) prix.PrixAchat = Number(data.PrixAchat);
    if (Number(data.PrixVente) > 0) prix.PrixVente = Number(data.PrixVente);
    if (Object.keys(prix).length) await Pharmacie.updateOne({ _id: String(data.IDMEDICAMENT) }, { $set: prix });
  }
  return entree;
}

/** Supprime une entrée et retire sa quantité du stock (refusé si elle a déjà été consommée). */
export async function annulerEntree(context: TenantContext, entree: Record<string, any>, auteur?: string) {
  const { EntreeStock } = getStockModels(context);
  const qte = Number(entree.Quantite) || 0;
  if (qte > 0 && (entree.IDMEDICAMENT || entree.Reference)) {
    await ajusterStock(context, {
      idMedicament: entree.IDMEDICAMENT,
      reference: entree.Reference,
      medicament: entree.Medicament,
      delta: -qte,
      auteur,
    });
  }
  await EntreeStock.deleteOne({ _id: entree._id });
}

interface SortieOptions {
  /** Convention caisse : le stock virtuel augmente des quantités vendues. */
  stockVirtuel?: boolean;
  /** Vente « intégrée » malgré un stock insuffisant : le stock peut devenir négatif. */
  autoriserNegatif?: boolean;
}

/**
 * Enregistre une sortie : convertit la quantité saisie (boîte/détail) en unités,
 * décrémente le stock (refus si insuffisant), puis crée la sortie.
 */
export async function enregistrerSortie(context: TenantContext, data: Record<string, any>, opts: SortieOptions = {}) {
  const { SortieStock, filter } = getStockModels(context);
  const conv = await convertirEnUnites(context, data.IDMEDICAMENT, data.Quantite, data.ModeVente);
  if (conv.qteUnites <= 0) throw new Error("La quantité doit être supérieure à 0.");

  const reference = data.Reference || conv.med?.Reference || "";
  const article = data.ArticleS || conv.med?.Designation || reference;
  const stock = await ajusterStock(context, {
    idMedicament: data.IDMEDICAMENT,
    reference,
    medicament: article,
    delta: -conv.qteUnites,
    deltaVirtuel: opts.stockVirtuel ? conv.qteUnites : 0,
    auteur: data.SaisiPar,
    autoriserNegatif: opts.autoriserNegatif,
  });

  try {
    return await SortieStock.create({
      ...data,
      ...filter,
      Reference: reference,
      ArticleS: article,
      Quantite: conv.qteUnites,
      QteConditionnement: conv.qteConditionnement ?? null,
      ModeVente: conv.mode,
      // Quantité vendue qui n'était pas en stock (due au patient)
      QteManquante: quantiteManquante(Number(stock?.QteEnStock) || 0, conv.qteUnites),
    });
  } catch (e) {
    await ajusterStock(context, {
      idMedicament: data.IDMEDICAMENT, reference, delta: conv.qteUnites,
      deltaVirtuel: opts.stockVirtuel ? -conv.qteUnites : 0, auteur: data.SaisiPar,
    }).catch(() => {});
    throw e;
  }
}

/**
 * Modifie une sortie et répercute l'écart sur le stock (y compris en cas de
 * changement de médicament ou de mode de vente).
 */
export async function modifierSortie(context: TenantContext, sortie: Record<string, any>, data: Record<string, any>, opts: SortieOptions = {}) {
  const { SortieStock } = getStockModels(context);
  const ancienMed = sortie.IDMEDICAMENT ? String(sortie.IDMEDICAMENT) : null;
  const nouveauMed = data.IDMEDICAMENT ? String(data.IDMEDICAMENT) : ancienMed;
  const ancienneQte = Number(sortie.Quantite) || 0;
  const reference = data.Reference || sortie.Reference || "";

  const quantiteModifiee = data.Quantite !== undefined || data.ModeVente !== undefined || nouveauMed !== ancienMed;
  const conv = quantiteModifiee
    ? await convertirEnUnites(context, nouveauMed, data.Quantite ?? sortie.QteConditionnement ?? sortie.Quantite, data.ModeVente ?? sortie.ModeVente)
    : null;
  const nouvelleQte = conv ? conv.qteUnites : ancienneQte;
  if (conv && nouvelleQte <= 0) throw new Error("La quantité doit être supérieure à 0.");
  const virt = (n: number) => (opts.stockVirtuel ? n : 0);
  const ancienManquant = Number(sortie.QteManquante) || 0;
  let qteManquante = ancienManquant;

  if (nouveauMed === ancienMed) {
    const diff = nouvelleQte - ancienneQte;
    if (diff !== 0 && (nouveauMed || reference)) {
      const stock = await ajusterStock(context, {
        idMedicament: nouveauMed, reference, medicament: sortie.ArticleS,
        delta: -diff, deltaVirtuel: virt(diff), auteur: data.SaisiPar,
        autoriserNegatif: opts.autoriserNegatif,
      });
      // Augmentation : ce qui manquait s'ajoute ; diminution : on rembourse d'abord la quantité due
      qteManquante = diff > 0
        ? ancienManquant + quantiteManquante(Number(stock?.QteEnStock) || 0, diff)
        : Math.max(0, ancienManquant + diff);
    }
  } else {
    const stock = await ajusterStock(context, {
      idMedicament: nouveauMed, reference: data.Reference || conv?.med?.Reference, medicament: data.ArticleS || conv?.med?.Designation,
      delta: -nouvelleQte, deltaVirtuel: virt(nouvelleQte), auteur: data.SaisiPar,
      autoriserNegatif: opts.autoriserNegatif,
    });
    qteManquante = quantiteManquante(Number(stock?.QteEnStock) || 0, nouvelleQte);
    if (ancienMed || sortie.Reference) {
      await ajusterStock(context, {
        idMedicament: ancienMed, reference: sortie.Reference, medicament: sortie.ArticleS,
        delta: ancienneQte, deltaVirtuel: virt(-ancienneQte), auteur: data.SaisiPar,
      });
    }
  }

  const update: Record<string, any> = { ...data, QteManquante: qteManquante };
  if (conv) {
    update.Quantite = nouvelleQte;
    update.QteConditionnement = conv.qteConditionnement ?? null;
    update.ModeVente = conv.mode;
  }
  return SortieStock.findByIdAndUpdate(sortie._id, update, { new: true });
}

/** Supprime une sortie et remet sa quantité en stock. */
export async function supprimerSortie(context: TenantContext, sortie: Record<string, any>, opts: SortieOptions = {}, auteur?: string) {
  const { SortieStock } = getStockModels(context);
  const qte = Number(sortie.Quantite) || 0;
  if (qte > 0 && (sortie.IDMEDICAMENT || sortie.Reference)) {
    await ajusterStock(context, {
      idMedicament: sortie.IDMEDICAMENT,
      reference: sortie.Reference,
      medicament: sortie.ArticleS,
      delta: qte,
      deltaVirtuel: opts.stockVirtuel ? -qte : 0,
      auteur,
    });
  }
  await SortieStock.deleteOne({ _id: sortie._id });
}
