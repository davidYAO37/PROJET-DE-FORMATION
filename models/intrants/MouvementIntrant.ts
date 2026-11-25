import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TypeMouvementIntrant = "entree" | "utilisation" | "perte" | "ajustement";
export const TYPES_MOUVEMENT_INTRANT: TypeMouvementIntrant[] = ["entree", "utilisation", "perte", "ajustement"];

export interface ILigneMouvementIntrant {
  intrantId: Types.ObjectId;
  designation: string;
  unite: string;
  /** Lot prélevé (utilisation/perte) ou créé (entrée). Vide si suiviLot = false. */
  lotId?: Types.ObjectId;
  numeroLot?: string;
  datePeremption?: Date;
  emplacement?: string;
  prixUnitaire: number;
  /** En unité de stock. Négatif uniquement pour une ligne d'ajustement. */
  quantite: number;
}

/**
 * Bon de mouvement d'intrants (autonome, sans lien avec les examens).
 * - entree      : réception / approvisionnement, crée un lot par ligne.
 * - utilisation : quantité effectivement utilisée (analyses, CQ, reprises...).
 * - perte       : casse, péremption... — sortie distincte de la consommation.
 * - ajustement  : correction d'inventaire (quantité signée).
 */
export interface IMouvementIntrant extends Document {
  numero: string;
  type: TypeMouvementIntrant;
  date: Date;
  motif?: string;
  observation?: string;
  fournisseur?: string;
  lignes: ILigneMouvementIntrant[];
  statut: "brouillon" | "valide" | "annule";
  saisiPar?: string;
  validePar?: string;
  valideLe?: Date;
  annulePar?: string;
  annuleLe?: Date;
  motifAnnulation?: string;
  entrepriseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LigneMouvementIntrantSchema = new Schema<ILigneMouvementIntrant>({
  intrantId: { type: Schema.Types.ObjectId, ref: "Intrant", required: true },
  designation: { type: String, required: true, maxlength: 250 },
  unite: { type: String, maxlength: 30 },
  lotId: { type: Schema.Types.ObjectId, ref: "LotIntrant" },
  numeroLot: { type: String, maxlength: 60 },
  datePeremption: { type: Date },
  emplacement: { type: String, maxlength: 100 },
  prixUnitaire: { type: Number, default: 0 },
  quantite: { type: Number, required: true },
}, { _id: false });

const MouvementIntrantSchema = new Schema<IMouvementIntrant>({
  numero: { type: String, required: true, maxlength: 40 },
  type: { type: String, required: true, enum: TYPES_MOUVEMENT_INTRANT },
  date: { type: Date, required: true },
  motif: { type: String, maxlength: 100 },
  observation: { type: String, maxlength: 300 },
  fournisseur: { type: String, maxlength: 150 },
  lignes: { type: [LigneMouvementIntrantSchema], default: [] },
  statut: { type: String, enum: ["brouillon", "valide", "annule"], default: "brouillon" },
  saisiPar: { type: String, maxlength: 60 },
  validePar: { type: String, maxlength: 60 },
  valideLe: { type: Date },
  annulePar: { type: String, maxlength: 60 },
  annuleLe: { type: Date },
  motifAnnulation: { type: String, maxlength: 200 },
  entrepriseId: { type: String },
}, { timestamps: true, collection: "mouvementsintrants" });

MouvementIntrantSchema.index({ type: 1, statut: 1 });
MouvementIntrantSchema.index({ date: 1 });
MouvementIntrantSchema.index({ "lignes.intrantId": 1 });
MouvementIntrantSchema.index({ numero: 1, entrepriseId: 1 });

export const MouvementIntrant: Model<IMouvementIntrant> =
  mongoose.models.MouvementIntrant || mongoose.model<IMouvementIntrant>("MouvementIntrant", MouvementIntrantSchema);
