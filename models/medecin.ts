import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedecin extends Document {
  _id: mongoose.Types.ObjectId | string;
  nom: string;
  prenoms: string;
  specialite?: string;
  EmailMed: string;
  TauxHonoraire?: number;
  TauxPrescription?: number;
  TauxExecution?: number;
  entrepriseId?: string;
  userId?: mongoose.Types.ObjectId;
}

const MedecinSchema = new Schema<IMedecin>(
  {
    nom: { type: String, required: true },
    prenoms: { type: String, required: true },
    specialite: { type: String },
    EmailMed: {type: String},
    TauxHonoraire: { type: Number },
    TauxPrescription: { type: Number },
    TauxExecution: { type: Number },
    entrepriseId: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Medecin: Model<IMedecin> =
  mongoose.models.Medecin || mongoose.model<IMedecin>("Medecin", MedecinSchema);
