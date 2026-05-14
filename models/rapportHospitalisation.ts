import mongoose, { Schema, Document, Model } from 'mongoose';
import { RapportHospitalisationForm } from '@/types/rapportHospitalisation';

export interface IRapportHospitalisation extends Document {
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateEntree: Date;
  dateSortie: Date;
  service: string;
  motifHospitalisation: string;
  diagnosticAdmission: string;
  diagnosticFinal: string;
  histoireMaladie: string;
  examenClinique: string;
  examensParacliniques?: string;
  traitementAdministre: string;
  evolution: string;
  complications?: string;
  suitesHospitalisation: string;
  medecinTraitant: string;
  medecinChefService?: string;
  recommandations: string;
  dateRapport: Date;
  dureeHospitalisation?: number;
  dateCreation: Date;
}

const RapportHospitalisationSchema = new Schema<IRapportHospitalisation>(
  {
    patientId: { type: String, required: true },
    patientNom: { type: String },
    patientPrenoms: { type: String },
    dateEntree: { type: Date, required: true },
    dateSortie: { type: Date, required: true },
    service: { type: String, required: true },
    motifHospitalisation: { type: String, required: true },
    diagnosticAdmission: { type: String, required: true },
    diagnosticFinal: { type: String, required: true },
    histoireMaladie: { type: String, required: true },
    examenClinique: { type: String, required: true },
    examensParacliniques: { type: String },
    traitementAdministre: { type: String, required: true },
    evolution: { type: String, required: true },
    complications: { type: String },
    suitesHospitalisation: { type: String, required: true },
    medecinTraitant: { type: String, required: true },
    medecinChefService: { type: String },
    recommandations: { type: String, required: true },
    dateRapport: { type: Date, default: Date.now },
    dureeHospitalisation: { type: Number },
    dateCreation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const RapportHospitalisation: Model<IRapportHospitalisation> =
  mongoose.models.RapportHospitalisation ||
  mongoose.model<IRapportHospitalisation>('RapportHospitalisation', RapportHospitalisationSchema);
