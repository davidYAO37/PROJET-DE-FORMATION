import mongoose, { Schema, Document, Model } from 'mongoose';
import { RapportHospitalisationForm } from '@/types/rapportHospitalisation';

export interface IRapportHospitalisation extends Document {
  patientId: string;
  hospitalisationId?: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateEntree: Date;
  dateSortie?: Date;
  service?: string;
  motifHospitalisation?: string;
  diagnosticAdmission?: string;
  diagnosticFinal?: string;
  histoireMaladie?: string;
  examenClinique?: string;
  examensParacliniques?: string;
  traitementAdministre?: string;
  evolution?: string;
  complications?: string;
  suitesHospitalisation?: string;
  medecinTraitant?: string;
  medecinChefService?: string;
  recommandations?: string;
  dateRapport: Date;
  dureeHospitalisation?: number;
  statut: 'brouillon' | 'a_completer' | 'valide';
  dateCreation: Date;
}

const RapportHospitalisationSchema = new Schema<IRapportHospitalisation>(
  {
    patientId: { type: String, required: true },
    hospitalisationId: { type: String },
    patientNom: { type: String },
    patientPrenoms: { type: String },
    dateEntree: { type: Date, required: true },
    dateSortie: { type: Date },
    service: { type: String },
    motifHospitalisation: { type: String },
    diagnosticAdmission: { type: String },
    diagnosticFinal: { type: String },
    histoireMaladie: { type: String },
    examenClinique: { type: String },
    examensParacliniques: { type: String },
    traitementAdministre: { type: String },
    evolution: { type: String },
    complications: { type: String },
    suitesHospitalisation: { type: String },
    medecinTraitant: { type: String },
    medecinChefService: { type: String },
    recommandations: { type: String },
    dateRapport: { type: Date, default: Date.now },
    dureeHospitalisation: { type: Number },
    statut: { type: String, enum: ['brouillon', 'a_completer', 'valide'], default: 'brouillon' },
    dateCreation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const RapportHospitalisation: Model<IRapportHospitalisation> =
  mongoose.models.RapportHospitalisation ||
  mongoose.model<IRapportHospitalisation>('RapportHospitalisation', RapportHospitalisationSchema);
