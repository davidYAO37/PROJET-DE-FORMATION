import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Lot d'un intrant : une réception crée un lot ; les utilisations et pertes
 * prélèvent dessus en priorité sur le lot qui expire le plus tôt (FEFO).
 */
export interface ILotIntrant extends Document {
  intrantId: Types.ObjectId;
  numeroLot: string;
  qteInitiale: number;
  qteRestante: number;
  dateReception: Date;
  datePeremption?: Date;
  dateOuverture?: Date;
  /** Date limite calculée à partir de l'ouverture / reconstitution. */
  dateLimiteOuverture?: Date;
  prixUnitaire: number;
  emplacement?: string;
  etat: "disponible" | "epuise" | "bloque" | "perime";
  origineMouvementId?: Types.ObjectId;
  entrepriseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LotIntrantSchema = new Schema<ILotIntrant>({
  intrantId: { type: Schema.Types.ObjectId, ref: "Intrant", required: true },
  numeroLot: { type: String, required: true, trim: true, maxlength: 60 },
  qteInitiale: { type: Number, required: true, min: 0 },
  qteRestante: { type: Number, required: true, min: 0 },
  dateReception: { type: Date, required: true },
  datePeremption: { type: Date },
  dateOuverture: { type: Date },
  dateLimiteOuverture: { type: Date },
  prixUnitaire: { type: Number, default: 0 },
  emplacement: { type: String, maxlength: 100 },
  etat: {
    type: String,
    enum: ["disponible", "epuise", "bloque", "perime"],
    default: "disponible",
  },
  origineMouvementId: { type: Schema.Types.ObjectId, ref: "MouvementIntrant" },
  entrepriseId: { type: String },
}, { timestamps: true, collection: "lotsintrants" });

LotIntrantSchema.index({ intrantId: 1, etat: 1 });
LotIntrantSchema.index({ datePeremption: 1 });

export const LotIntrant: Model<ILotIntrant> =
  mongoose.models.LotIntrant || mongoose.model<ILotIntrant>("LotIntrant", LotIntrantSchema);
