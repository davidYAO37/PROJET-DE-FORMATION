/* import mongoose, { Schema, models, model } from "mongoose";

const PatientSchema = new Schema({
  nom: { type: String, required: true },
  prenoms: { type: String, required: true },
  age: { type: Number, required: true },
  sexe: { type: String, required: true },
  contact: { type: String, required: true },
  codeDossier: { type: String, required: true },
});

export const Patient = models.Patient || model("Patient", PatientSchema);
 */
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatient extends Document {
  nom: string;
  prenoms: string;
  age: number;
  sexe: string;
  contact: string;
  codeDossier: string;
}

const PatientSchema = new Schema<IPatient>(
  {
    nom: { type: String, required: true },
    prenoms: { type: String, required: true },
    age: { type: Number, required: true },
    sexe: { type: String, required: true },
    contact: { type: String, required: true },
    codeDossier: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);
