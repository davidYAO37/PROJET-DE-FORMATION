import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Catalogue des intrants du laboratoire (réactifs, kits, consommables,
 * contrôles qualité, produits d'hygiène, etc.).
 * `qteEnStock` est le solde en unité de consommation, décrémenté de façon
 * atomique : c'est lui qui refuse une utilisation supérieure au stock.
 */
export interface IIntrant extends Document {
  reference: string;
  designation: string;
  categorie: string;
  sousCategorie?: string;
  /** Unité de stock et de consommation (pièce, mL, g, test...). */
  uniteStock: string;
  /** Libellé du conditionnement d'achat (boîte, flacon...). */
  conditionnement?: string;
  /** Unités de stock contenues dans un conditionnement d'achat. */
  qteParConditionnement: number;
  qteEnStock: number;
  seuilMinimum: number;
  seuilMaximum: number;
  /** Suivi par numéro de lot / péremption. */
  suiviLot: boolean;
  /** Stabilité après ouverture ou reconstitution, en jours. */
  delaiApresOuvertureJours?: number;
  conservation?: string;
  fournisseur?: string;
  prixAchat: number;
  actif: boolean;
  auteurModif?: string;
  entrepriseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IntrantSchema = new Schema<IIntrant>({
  reference: { type: String, required: true, trim: true, maxlength: 100 },
  designation: { type: String, required: true, trim: true, maxlength: 250 },
  categorie: { type: String, required: true, trim: true, maxlength: 100 },
  sousCategorie: { type: String, trim: true, maxlength: 100 },
  uniteStock: { type: String, required: true, trim: true, maxlength: 30 },
  conditionnement: { type: String, trim: true, maxlength: 100 },
  qteParConditionnement: { type: Number, default: 1, min: 0 },
  qteEnStock: { type: Number, default: 0 },
  seuilMinimum: { type: Number, default: 0 },
  seuilMaximum: { type: Number, default: 0 },
  suiviLot: { type: Boolean, default: true },
  delaiApresOuvertureJours: { type: Number },
  conservation: { type: String, maxlength: 200 },
  fournisseur: { type: String, maxlength: 150 },
  prixAchat: { type: Number, default: 0 },
  actif: { type: Boolean, default: true },
  auteurModif: { type: String, maxlength: 60 },
  entrepriseId: { type: String },
}, { timestamps: true, collection: "intrants" });

IntrantSchema.index({ reference: 1, entrepriseId: 1 });
IntrantSchema.index({ designation: 1 });
IntrantSchema.index({ categorie: 1 });

export const Intrant: Model<IIntrant> =
  mongoose.models.Intrant || mongoose.model<IIntrant>("Intrant", IntrantSchema);
