import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITarifAssurance extends Document {
  acteAssurance: string;
  lettreCle?: string;
  coefficient?: number;
  prixmutuel: number;
  prixpreferenciel: number;
  assurance: mongoose.Types.ObjectId;
}

const TarifAssuranceSchema = new Schema<ITarifAssurance>(
  {
    acteAssurance: { type: String, required: true },
    prixmutuel: { type: Number, required: true },
    lettreCle: { type: String, required: true, unique: true },
    coefficient: { type: Number, required: true },
    prixpreferenciel: { type: Number, required: true },
    assurance: { type: Schema.Types.ObjectId, ref: "Assurance", required: true },
  },
  { timestamps: true }
);

export const TarifAssurance: Model<ITarifAssurance> =
  mongoose.models.TarifAssurance || mongoose.model<ITarifAssurance>("TarifAssurance", TarifAssuranceSchema);
