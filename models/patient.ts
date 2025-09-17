import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatient extends Document {
  Nom: string;
  Prenoms: string;
  sexe: string;
  Age_partient: number;
  Date_naisse: Date;
  Code_dossier: string;
  Situationgeo: string;
  Reçule: Date;
  Contact: string;
  ProvisionClient: number;
  DepenseProvision: number;
  SocieteP: string;
  Matricule: string;
  AntecedentMedico: string;
  AnteChirurgico: string;
  AnteFamille: string;
  AutreAnte: string;
  Souscripteur: string;
  AlergiePatient: string;
  IDASSURANCE: mongoose.Types.ObjectId; // relation
  Assuance: string;
  IDSOCIETEASSUANCE: mongoose.Types.ObjectId; // relation
  SOCIETE_PATIENT: string;
  Taux: number;
  TarifPatient: string;
}

const PatientSchema = new Schema<IPatient>(
  {
    Nom: { type: String, required: true },
    Prenoms: { type: String, required: true },
    sexe: { type: String, required: true },
    Age_partient: { type: Number, required: true },
    Date_naisse: { type: Date, required: true },
    Code_dossier: { type: String, required: true, unique: true },
    Situationgeo: { type: String, required: false },
    Reçule: { type: Date, required: false },
    Contact: { type: String, required: false },
    ProvisionClient: { type: Number, required: false },
    DepenseProvision: { type: Number, required: false },
    SocieteP: { type: String, required: false },
    Matricule: { type: String, required: false },
    AntecedentMedico: { type: String, required: false },
    AnteChirurgico: { type: String, required: false },
    AnteFamille: { type: String, required: false },
    AutreAnte: { type: String, required: false },
    Souscripteur: { type: String, required: false },
    AlergiePatient: { type: String, required: false },
    IDASSURANCE: { type: Schema.Types.ObjectId, ref: 'Assurance', required: false },
    Assuance: { type: String, required: false },
    IDSOCIETEASSUANCE: { type: Schema.Types.ObjectId, ref: 'SocietePatient', required: false },
    SOCIETE_PATIENT: { type: String, required: false },
    Taux: { type: Number, required: false },
    TarifPatient: { type: String, required: false },
  },
  { timestamps: true }
);

export const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);
