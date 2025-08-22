import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatient extends Document {
  nom: string;
  prenoms: string;
  age: number;
  sexe: string;
  contact: string;
  codeDossier: string;
  typevisiteur: string; // facultatif
  matriculepatient?: string; // facultatif
  dateNaissance?: Date; // facultatif
  tauxassurance?: number; // facultatif
  assurance?: string; // facultatif, référence à l'assurance

}

const PatientSchema = new Schema<IPatient>(
  {
    nom: { type: String, required: true },
    prenoms: { type: String, required: true },
    age: { type: Number, required: true },
    sexe: { type: String, required: true },
    contact: { type: String, required: true },
    typevisiteur: { type: String, required: false, default: 'Non Assuré' }, // par défaut 'Patient'
    codeDossier: { type: String, required: true, unique: true },
    matriculepatient: { type: String, required: false },
    dateNaissance: { type: Date, required: false },
    tauxassurance: { type: Number, required: false },
    assurance: { type: Schema.Types.ObjectId, ref: 'Assurance', required: false },
  },
  { timestamps: true }
);

export const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);
