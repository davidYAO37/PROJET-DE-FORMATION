import mongoose, { Schema, Document, Model } from 'mongoose';
import { RapportHospitalisationForm } from '@/types/rapportHospitalisation';

export interface IRapportHospitalisation extends Document {
  patientId: string;
  hospitalisationId?: string;
  patientNom?: string;
  patientPrenoms?: string;
  patientDateNaissance?: Date;
  patientSexe?: string;
  patientNumeroDossier?: string;
  patientAssurance?: string;
  dateEntree: Date;
  dateSortie?: Date;
  service?: string;
  motifHospitalisation?: string;
  antecedentsMedicaux?: string;
  antecedentsChirurgicaux?: string;
  tensionArterielle?: string;
  temperature?: string;
  pouls?: string;
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
  conclusion?: string;
  dateRapport: Date;
  dureeHospitalisation?: number;
  statut: 'brouillon' | 'a_valider' | 'valide' | 'annule' | 'a_completer';
  auteurId?: string;
  validatedAt?: Date;
  validatedBy?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  motifAnnulation?: string;
  dateCreation: Date;
}

const RapportHospitalisationSchema = new Schema<IRapportHospitalisation>(
  {
    patientId: { type: String, required: true },
    hospitalisationId: { type: String },
    patientNom: { type: String },
    patientPrenoms: { type: String },
    patientDateNaissance: { type: Date },
    patientSexe: { type: String },
    patientNumeroDossier: { type: String },
    patientAssurance: { type: String },
    dateEntree: { type: Date, required: true },
    dateSortie: { type: Date },
    service: { type: String },
    motifHospitalisation: { type: String },
    antecedentsMedicaux: { type: String },
    antecedentsChirurgicaux: { type: String },
    tensionArterielle: { type: String },
    temperature: { type: String },
    pouls: { type: String },
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
    conclusion: { type: String },
    dateRapport: { type: Date, default: Date.now },
    dureeHospitalisation: { type: Number },
    statut: { type: String, enum: ['brouillon', 'a_valider', 'valide', 'annule', 'a_completer'], default: 'brouillon' },
    auteurId: { type: String },
    validatedAt: { type: Date },
    validatedBy: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    motifAnnulation: { type: String },
    dateCreation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const RapportHospitalisation: Model<IRapportHospitalisation> =
  mongoose.models.RapportHospitalisation ||
  mongoose.model<IRapportHospitalisation>('RapportHospitalisation', RapportHospitalisationSchema);
