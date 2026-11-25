import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Correspondance statistique entre un intrant et une analyse de laboratoire.
 * Sert uniquement au rapport consommation / activité : aucun mouvement de
 * stock n'est déclenché à partir de ces règles.
 */
export interface IRegleComparaisonIntrant extends Document {
  intrantId: Types.ObjectId;
  /** Acte ciblé (au moins un de idActe / prestation est requis). */
  idActe?: Types.ObjectId;
  prestation?: string;
  /** Famille d'actes biologiques (comparaison élargie). */
  familleActe?: string;
  /** Consommation théorique par analyse, en unité de stock de l'intrant. */
  consommationTheorique: number;
  dateEffet?: Date;
  actif: boolean;
  entrepriseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegleComparaisonIntrantSchema = new Schema<IRegleComparaisonIntrant>({
  intrantId: { type: Schema.Types.ObjectId, ref: "Intrant", required: true },
  idActe: { type: Schema.Types.ObjectId, ref: "Acteclinique" },
  prestation: { type: String, trim: true, maxlength: 250 },
  familleActe: { type: String, trim: true, maxlength: 150 },
  consommationTheorique: { type: Number, required: true, min: 0 },
  dateEffet: { type: Date },
  actif: { type: Boolean, default: true },
  entrepriseId: { type: String },
}, { timestamps: true, collection: "reglescomparaisonintrants" });

RegleComparaisonIntrantSchema.index({ intrantId: 1, actif: 1 });

export const RegleComparaisonIntrant: Model<IRegleComparaisonIntrant> =
  mongoose.models.RegleComparaisonIntrant ||
  mongoose.model<IRegleComparaisonIntrant>("RegleComparaisonIntrant", RegleComparaisonIntrantSchema);
