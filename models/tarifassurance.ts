import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITarifAssurance extends Document {
  acte: string;
  acteId: mongoose.Types.ObjectId;      // <- nouvel ID de l'acte
  lettreCle?: string;
  coefficient?: number;
  prixmutuel: number;
  prixpreferenciel: number;
  assurance: mongoose.Types.ObjectId;
}

const TarifAssuranceSchema = new Schema<ITarifAssurance>(
  {
    acte: { type: String, required: true },
    acteId: { type: Schema.Types.ObjectId, ref: "ActeClinique", required: true }, // lien direct
    lettreCle: { type: String, required: true },
    coefficient: { type: Number, required: true },
    prixmutuel: { type: Number, required: true },
    prixpreferenciel: { type: Number, required: true },
    assurance: { type: Schema.Types.ObjectId, ref: "Assurance", required: true },
  },
  { timestamps: true }
);

// Index unique pour éviter les doublons : une assurance ne peut avoir qu'un seul tarif par acte
TarifAssuranceSchema.index({ assurance: 1, acteId: 1 }, { unique: true });

export const TarifAssurance: Model<ITarifAssurance> = mongoose.models.TarifAssurance || mongoose.model<ITarifAssurance>("TarifAssurance", TarifAssuranceSchema);
