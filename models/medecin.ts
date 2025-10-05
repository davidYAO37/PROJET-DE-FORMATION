import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedecin extends Document {
  nom: string;
  prenoms: string;
  specialite: string;
  TauxHonoraire: number;
  TauxPrescription:number;
  TauxExecution:number;
}

const MedecinSchema = new Schema<IMedecin>(
  {
    nom: { type: String, required: true },
    prenoms: { type: String, required: true },
    specialite: { type: String},
    TauxHonoraire: { type: Number },
    TauxPrescription: { type: Number },
    TauxExecution: { type: Number },
  },
  { timestamps: true }
);

export const Medecin: Model<IMedecin> =
  mongoose.models.Medecin || mongoose.model<IMedecin>("Medecin", MedecinSchema);
