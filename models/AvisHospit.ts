import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAvisHospit extends Document {
  // Informations principales
  serviceHospit: string; // MED, CHIR, CHR.SP, OBST, GYN, PED
  etatPatient: string; // Urgent, Semi-Urgent, Electif
  DureHospit: string; // Durée probable de l'hospitalisation
  Patient: string; // Nom et prénoms du patient
  DateIntervention: Date;
  HeureHospit: string;
  NumDoc: string;
  MedecinTraitant: string;
  Diagnostic: string;
  DatePrevue: Date;
  assurance: string;
  SocieteP: string;
  IDPARTIENT: mongoose.Types.ObjectId;
  IDCONSULTATION?: mongoose.Types.ObjectId; // Lien avec la consultation
  
  // Flags de service (un seul true à la fois)
  MED: boolean;
  CHR: boolean;
  CHRSP: boolean;
  OBST: boolean;
  GYN: boolean;
  PED: boolean;
  
  // Flags d'état patient (un seul true à la fois)
  URGENT: boolean;
  SEMIURGENT: boolean;
  ELECTIF: boolean;
  
  // Autres champs
  Isolement: boolean;
  HospitAnt: boolean;
  sejourunjour: boolean;
  
  // Métadonnées
  entrepriseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AvisHospitSchema = new Schema<IAvisHospit>({
  // Informations principales
  serviceHospit: { type: String, required: true, enum: ['MED', 'CHIR', 'CHR.SP', 'OBST', 'GYN', 'PED'] },
  etatPatient: { type: String, required: true, enum: ['Urgent', 'Semi-Urgent', 'Electif'] },
  DureHospit: { type: String, required: true },
  Patient: { type: String, required: true },
  DateIntervention: { type: Date, required: true },
  HeureHospit: { type: String, required: true },
  NumDoc: { type: String, required: true },
  MedecinTraitant: { type: String, required: true },
  Diagnostic: { type: String, required: true },
  DatePrevue: { type: Date, required: true },
  assurance: { type: String },
  SocieteP: { type: String },
  IDPARTIENT: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  IDCONSULTATION: { type: Schema.Types.ObjectId, ref: 'Consultation' },
  
  // Flags de service
  MED: { type: Boolean, default: false },
  CHR: { type: Boolean, default: false },
  CHRSP: { type: Boolean, default: false },
  OBST: { type: Boolean, default: false },
  GYN: { type: Boolean, default: false },
  PED: { type: Boolean, default: false },
  
  // Flags d'état patient
  URGENT: { type: Boolean, default: false },
  SEMIURGENT: { type: Boolean, default: false },
  ELECTIF: { type: Boolean, default: false },
  
  // Autres champs
  Isolement: { type: Boolean, default: false },
  HospitAnt: { type: Boolean, default: false },
  sejourunjour: { type: Boolean, default: false },
  
  // Métadonnées
  entrepriseId: { type: String }
}, { 
  timestamps: true,
  collection: 'avishospit'
});

// Index pour optimiser les recherches
AvisHospitSchema.index({ IDPARTIENT: 1 });
AvisHospitSchema.index({ IDCONSULTATION: 1 });
AvisHospitSchema.index({ DateIntervention: 1 });
AvisHospitSchema.index({ serviceHospit: 1 });
AvisHospitSchema.index({ etatPatient: 1 });

export const AvisHospit: Model<IAvisHospit> = 
  mongoose.models.AvisHospit || mongoose.model<IAvisHospit>("AvisHospit", AvisHospitSchema);
