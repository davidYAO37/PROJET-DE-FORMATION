import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getTenantModel } from "@/lib/tenantModels";
import { getTenantFilter, type TenantContext } from "@/lib/withTenant";
import type { IIntrant } from "@/models/intrants/Intrant";
import type { ILotIntrant } from "@/models/intrants/LotIntrant";
import type { ILigneMouvementIntrant, IMouvementIntrant, TypeMouvementIntrant } from "@/models/intrants/MouvementIntrant";
import type { IRegleComparaisonIntrant } from "@/models/intrants/RegleComparaisonIntrant";

/** Lecture du module intrants (y compris les statistiques et la comparaison). */
export const ROLES_INTRANTS_LECTURE = ["admin", "biologiste", "technicienlabo", "medecin", "comptable", "facturation"];
/** Saisie des mouvements : réceptions, utilisations, pertes, ajustements. */
export const ROLES_INTRANTS_MOUVEMENT = ["admin", "biologiste", "technicienlabo"];
/** Paramétrage : catalogue et règles de comparaison. */
export const ROLES_INTRANTS_PARAMETRAGE = ["admin", "biologiste"];

export class StockIntrantInsuffisantError extends Error {
  constructor(
    public designation: string,
    public disponible: number,
    public demande: number
  ) {
    super(`Stock insuffisant pour « ${designation} » : disponible ${disponible}, demandé ${demande}.`);
    this.name = "StockIntrantInsuffisantError";
  }
}

export function intrantErrorResponse(err: any) {
  if (err instanceof StockIntrantInsuffisantError) {
    return NextResponse.json(
      { error: err.message, code: "STOCK_INTRANT_INSUFFISANT", intrant: err.designation, disponible: err.disponible, demande: err.demande },
      { status: 409 }
    );
  }
  return NextResponse.json({ error: err?.message || "Erreur intrants" }, { status: 400 });
}

export function getIntrantModels(context: TenantContext) {
  return {
    Intrant: getTenantModel<IIntrant>(context.connection, "Intrant"),
    LotIntrant: getTenantModel<ILotIntrant>(context.connection, "LotIntrant"),
    MouvementIntrant: getTenantModel<IMouvementIntrant>(context.connection, "MouvementIntrant"),
    RegleComparaison: getTenantModel<IRegleComparaisonIntrant>(context.connection, "RegleComparaisonIntrant"),
    filter: getTenantFilter(context),
  };
}

const isObjectId = (id: unknown): id is string =>
  !!id && mongoose.Types.ObjectId.isValid(String(id));

/** Date limite d'utilisation effective d'un lot (péremption ou ouverture). */
export function dateLimiteLot(lot: { datePeremption?: Date | null; dateLimiteOuverture?: Date | null }) {
  const dates = [lot.datePeremption, lot.dateLimiteOuverture]
    .filter((d): d is Date => !!d)
    .map((d) => new Date(d).getTime());
  return dates.length ? new Date(Math.min(...dates)) : null;
}

/** Marque les lots périmés (limite dépassée) d'un tenant. */
export async function rafraichirLotsPerimes(context: TenantContext) {
  const { LotIntrant, filter } = getIntrantModels(context);
  const now = new Date();
  await LotIntrant.updateMany(
    {
      ...filter,
      etat: { $in: ["disponible", "bloque"] },
      qteRestante: { $gt: 0 },
      $or: [
        { datePeremption: { $lte: now } },
        { dateLimiteOuverture: { $lte: now } },
      ],
    },
    { $set: { etat: "perime" } }
  );
}

/** Décrémente le solde de l'intrant de façon atomique (refus si insuffisant). */
async function debiterIntrant(
  context: TenantContext,
  intrantId: string,
  designation: string,
  qte: number,
  auteur?: string
) {
  const { Intrant, filter } = getIntrantModels(context);
  const updated = await Intrant.findOneAndUpdate(
    { _id: intrantId, ...filter, qteEnStock: { $gte: qte } },
    { $inc: { qteEnStock: -qte }, $set: { auteurModif: auteur || "Système" } },
    { new: true }
  );
  if (!updated) {
    const actuel = await Intrant.findOne({ _id: intrantId, ...filter }).select("qteEnStock").lean<any>();
    if (!actuel) throw new Error(`Intrant « ${designation} » introuvable.`);
    throw new StockIntrantInsuffisantError(designation, Number(actuel.qteEnStock) || 0, qte);
  }
  return updated;
}

async function crediterIntrant(context: TenantContext, intrantId: string, qte: number, auteur?: string) {
  const { Intrant, filter } = getIntrantModels(context);
  return Intrant.findOneAndUpdate(
    { _id: intrantId, ...filter },
    { $inc: { qteEnStock: qte }, $set: { auteurModif: auteur || "Système" } },
    { new: true }
  );
}

/** Ordre FEFO : limite la plus proche en premier, puis réception la plus ancienne. */
function trierLotsFEFO<T extends { datePeremption?: any; dateLimiteOuverture?: any; dateReception?: any }>(lots: T[]) {
  return [...lots].sort((a, b) => {
    const la = dateLimiteLot(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const lb = dateLimiteLot(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (la !== lb) return la - lb;
    return new Date(a.dateReception || 0).getTime() - new Date(b.dateReception || 0).getTime();
  });
}

/**
 * Prélève `qte` sur les lots disponibles de l'intrant (FEFO) ou sur le lot
 * demandé. Retourne les prélèvements effectués. Suppose que le solde global
 * a déjà été contrôlé.
 */
export async function preleverSurLots(
  context: TenantContext,
  intrantId: string,
  qte: number,
  lotId?: unknown
): Promise<{ lotId: string; numeroLot: string; quantite: number }[]> {
  const { LotIntrant, filter } = getIntrantModels(context);
  const prelevements: { lotId: string; numeroLot: string; quantite: number }[] = [];
  let reste = qte;

  const candidats = lotId
    ? await LotIntrant.find({ _id: String(lotId), intrantId, ...filter })
    : await LotIntrant.find({ intrantId, ...filter, etat: "disponible", qteRestante: { $gt: 0 } });

  for (const lot of trierLotsFEFO(candidats)) {
    if (reste <= 0) break;
    if (lot.etat !== "disponible") {
      throw new Error(`Le lot « ${lot.numeroLot} » n'est pas disponible (état : ${lot.etat}).`);
    }
    const prise = Math.min(reste, Number(lot.qteRestante) || 0);
    if (prise <= 0) continue;
    const nouvelleQte = Number(lot.qteRestante) - prise;
    await LotIntrant.updateOne(
      { _id: lot._id, qteRestante: { $gte: prise } },
      { $set: { qteRestante: nouvelleQte, etat: nouvelleQte <= 0 ? "epuise" : "disponible" } }
    );
    prelevements.push({ lotId: String(lot._id), numeroLot: lot.numeroLot, quantite: prise });
    reste -= prise;
  }

  if (reste > 0.000001) {
    // Les lots ne couvrent pas le solde déclaré : données incohérentes.
    throw new Error(`Lots insuffisants pour couvrir la quantité demandée (reste ${reste}).`);
  }
  return prelevements;
}

/** Recrédite un lot existant ou recrée un lot de retour si nécessaire. */
export async function recrediterLot(
  context: TenantContext,
  ligne: ILigneMouvementIntrant,
  auteur?: string
) {
  const { LotIntrant, filter } = getIntrantModels(context);
  const qte = Math.abs(Number(ligne.quantite) || 0);
  if (!qte) return;

  if (ligne.lotId) {
    const lot = await LotIntrant.findOne({ _id: ligne.lotId, ...filter });
    if (lot) {
      const qteRestante = Number(lot.qteRestante) + qte;
      await LotIntrant.updateOne(
        { _id: lot._id },
        { $set: { qteRestante, etat: lot.etat === "perime" ? "perime" : "disponible" } }
      );
      return;
    }
  }
  // Lot d'origine introuvable : création d'un lot de régularisation.
  await LotIntrant.create({
    ...filter,
    intrantId: ligne.intrantId,
    numeroLot: `RETOUR-${ligne.numeroLot || Date.now()}`,
    qteInitiale: qte,
    qteRestante: qte,
    dateReception: new Date(),
    datePeremption: ligne.datePeremption,
    prixUnitaire: ligne.prixUnitaire || 0,
    emplacement: ligne.emplacement,
    etat: "disponible",
  });
}

interface LigneInput {
  intrantId?: unknown;
  lotId?: unknown;
  numeroLot?: unknown;
  datePeremption?: unknown;
  dateOuverture?: unknown;
  emplacement?: unknown;
  prixUnitaire?: unknown;
  quantite?: unknown;
}

/**
 * Applique un mouvement validé au stock et aux lots, ligne par ligne.
 * Toutes les lignes sont contrôlées avant toute déduction (tout ou rien).
 */
export async function appliquerMouvement(
  context: TenantContext,
  mouvement: IMouvementIntrant,
  auteur?: string
): Promise<ILigneMouvementIntrant[]> {
  const { Intrant, LotIntrant, filter } = getIntrantModels(context);
  const type = mouvement.type as TypeMouvementIntrant;
  const lignesResultat: ILigneMouvementIntrant[] = [];
  const now = mouvement.date || new Date();

  // Pré-contrôle : intrants existants et quantités cumulées disponibles.
  const besoins = new Map<string, { qte: number; designation: string; intrant: any }>();
  for (const ligne of mouvement.lignes) {
    const id = String(ligne.intrantId);
    const intrant = besoins.get(id)?.intrant ||
      await Intrant.findOne({ _id: id, ...filter }).lean<any>();
    if (!intrant) throw new Error("Un intrant du bon est introuvable.");
    const qte = Math.abs(Number(ligne.quantite) || 0);
    if (type !== "ajustement" && Number(ligne.quantite) <= 0) {
      throw new Error(`La quantité de « ${intrant.designation} » doit être supérieure à 0.`);
    }
    const cur = besoins.get(id) || { qte: 0, designation: intrant.designation, intrant };
    // Besoin sortant : utilisations/pertes et ajustements négatifs uniquement.
    const sortant = type === "utilisation" || type === "perte" || (type === "ajustement" && Number(ligne.quantite) < 0);
    if (sortant) cur.qte += qte;
    besoins.set(id, cur);
    if (type === "entree" && intrant.suiviLot && !ligne.numeroLot) {
      throw new Error(`Le numéro de lot est requis pour « ${intrant.designation} ».`);
    }
  }

  // Débit préalable du solde global (atomique) pour les sorties/ajustements négatifs.
  for (const [id, b] of besoins) {
    if (b.qte > 0) await debiterIntrant(context, id, b.designation, b.qte, auteur);
  }

  try {
    for (const ligne of mouvement.lignes) {
      const id = String(ligne.intrantId);
      const intrant = besoins.get(id)!.intrant;
      const qte = Math.abs(Number(ligne.quantite) || 0);
      const base = {
        intrantId: ligne.intrantId as any,
        designation: intrant.designation,
        unite: intrant.uniteStock,
        numeroLot: ligne.numeroLot || undefined,
        datePeremption: ligne.datePeremption,
        emplacement: ligne.emplacement,
        prixUnitaire: Number(ligne.prixUnitaire) || 0,
      };

      if (type === "entree") {
        await crediterIntrant(context, id, qte, auteur);
        let lotId;
        if (intrant.suiviLot) {
          const lot = await LotIntrant.create({
            ...filter,
            intrantId: ligne.intrantId,
            numeroLot: String(ligne.numeroLot),
            qteInitiale: qte,
            qteRestante: qte,
            dateReception: now,
            datePeremption: ligne.datePeremption,
            prixUnitaire: Number(ligne.prixUnitaire) || intrant.prixAchat || 0,
            emplacement: ligne.emplacement,
            etat: "disponible",
            origineMouvementId: mouvement._id,
          });
          lotId = lot._id;
        }
        lignesResultat.push({ ...base, lotId, quantite: qte });
      } else if (type === "ajustement") {
        const delta = Number(ligne.quantite) || 0;
        if (delta >= 0) {
          await crediterIntrant(context, id, delta, auteur);
          let lotId;
          if (intrant.suiviLot) {
            const lot = await LotIntrant.create({
              ...filter,
              intrantId: ligne.intrantId,
              numeroLot: ligne.numeroLot || `AJUST-${mouvement.numero}`,
              qteInitiale: delta,
              qteRestante: delta,
              dateReception: now,
              datePeremption: ligne.datePeremption,
              prixUnitaire: Number(ligne.prixUnitaire) || intrant.prixAchat || 0,
              emplacement: ligne.emplacement,
              etat: "disponible",
              origineMouvementId: mouvement._id,
            });
            lotId = lot._id;
          }
          lignesResultat.push({ ...base, lotId, quantite: delta });
        } else if (intrant.suiviLot) {
          const prelevements = await preleverSurLots(context, id, -delta, ligne.lotId);
          for (const p of prelevements) {
            lignesResultat.push({
              ...base,
              lotId: p.lotId as any,
              numeroLot: p.numeroLot,
              quantite: -p.quantite,
            });
          }
        } else {
          lignesResultat.push({ ...base, quantite: delta });
        }
      } else if (intrant.suiviLot) {
        // utilisation / perte : prélèvement FEFO ou lot imposé
        const prelevements = await preleverSurLots(context, id, qte, ligne.lotId);
        for (const p of prelevements) {
          lignesResultat.push({ ...base, lotId: p.lotId as any, numeroLot: p.numeroLot, quantite: p.quantite });
        }
      } else {
        lignesResultat.push({ ...base, quantite: qte });
      }
    }
  } catch (err) {
    // Rattrapage : recrédite le solde global déjà débité.
    for (const [id, b] of besoins) {
      if (b.qte > 0) await crediterIntrant(context, id, b.qte, auteur).catch(() => {});
    }
    throw err;
  }

  return lignesResultat;
}

/**
 * Inverse un mouvement validé : les sorties recréditent les lots d'origine,
 * les entrées retirent les quantités restantes des lots créés (refus si un
 * lot a déjà été consommé).
 */
export async function annulerMouvement(
  context: TenantContext,
  mouvement: IMouvementIntrant,
  auteur?: string
) {
  const { LotIntrant, filter } = getIntrantModels(context);
  const type = mouvement.type as TypeMouvementIntrant;

  if (type === "entree" || (type === "ajustement")) {
    // Vérifie que les lots créés par ce mouvement n'ont pas été consommés.
    for (const ligne of mouvement.lignes) {
      const qte = Number(ligne.quantite) || 0;
      if (type === "entree" || qte > 0) {
        if (ligne.lotId) {
          const lot = await LotIntrant.findOne({ _id: ligne.lotId, ...filter });
          if (!lot) throw new Error(`Le lot « ${ligne.numeroLot} » est introuvable : annulation impossible.`);
          const recu = type === "entree" ? Number(ligne.quantite) : qte;
          if (Number(lot.qteRestante) < recu) {
            throw new Error(`Le lot « ${lot.numeroLot} » a déjà été consommé : annulation impossible.`);
          }
        }
      }
    }
    for (const ligne of mouvement.lignes) {
      const delta = type === "entree" ? Math.abs(Number(ligne.quantite) || 0) : Number(ligne.quantite) || 0;
      if (ligne.lotId && delta > 0) {
        const lot = await LotIntrant.findOne({ _id: ligne.lotId });
        if (lot) {
          const reste = Number(lot.qteRestante) - delta;
          await LotIntrant.updateOne(
            { _id: lot._id },
            { $set: { qteRestante: Math.max(0, reste), etat: reste <= 0 ? "epuise" : lot.etat } }
          );
        }
      }
      // Inversion : une entrée (ou un ajustement positif) débite, un ajustement
      // négatif recrédite.
      if (delta > 0) await debiterIntrant(context, String(ligne.intrantId), ligne.designation, delta, auteur);
      else if (delta < 0) await crediterIntrant(context, String(ligne.intrantId), -delta, auteur);
    }
    return;
  }

  // utilisation / perte : on remet les quantités dans les lots d'origine.
  for (const ligne of mouvement.lignes) {
    await crediterIntrant(context, String(ligne.intrantId), Math.abs(Number(ligne.quantite) || 0), auteur);
    await recrediterLot(context, ligne, auteur);
  }
}

/** Numéro de bon unique par tenant (séquence horodatée). */
export function genererNumeroMouvement(type: TypeMouvementIntrant) {
  const prefixe = { entree: "RE", utilisation: "UT", perte: "PE", ajustement: "AJ" }[type] || "MV";
  const stamp = Date.now().toString(36).toUpperCase();
  const alea = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
  return `${prefixe}-${stamp}${alea}`;
}

export { isObjectId };
export type { LigneInput };
