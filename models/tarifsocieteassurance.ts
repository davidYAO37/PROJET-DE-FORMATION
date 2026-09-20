import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITarifSocieteAssurance extends Document {
  acte: string;
  acteId: mongoose.Types.ObjectId;
  lettreCle?: string;
  coefficient?: number;
  prixmutuel: number;
  prixpreferenciel: number;
  societeAssurance: mongoose.Types.ObjectId;
  assurance: mongoose.Types.ObjectId;
  entrepriseId?: string;
}

const TarifSocieteAssuranceSchema = new Schema<ITarifSocieteAssurance>(
  {
    acte: { type: String, required: true },
    acteId: { type: Schema.Types.ObjectId, ref: "ActeClinique", required: true },
    lettreCle: { type: String, required: true },
    coefficient: { type: Number, required: true },
    prixmutuel: { type: Number, required: true, default: 0 },
    prixpreferenciel: { type: Number, required: true, default: 0 },
    societeAssurance: { type: Schema.Types.ObjectId, ref: "SocieteAssurance", required: true },
    assurance: { type: Schema.Types.ObjectId, ref: "Assurance", required: true },
    entrepriseId: { type: String },
  },
  { timestamps: true }
);

TarifSocieteAssuranceSchema.index({ societeAssurance: 1, acteId: 1 }, { unique: true });

export const TarifSocieteAssurance: Model<ITarifSocieteAssurance> =
  mongoose.models.TarifSocieteAssurance ||
  mongoose.model<ITarifSocieteAssurance>("TarifSocieteAssurance", TarifSocieteAssuranceSchema);
