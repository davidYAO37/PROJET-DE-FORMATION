import mongoose, { Schema, InferSchemaType } from 'mongoose';

const certificatDecesSchema = new Schema({
  entrepriseId: { type: String, index: true },
  patientId: { type: Schema.Types.ObjectId, required: true, index: true },
  patientNom: { type: String, required: true },
  patientPrenoms: String,
  patientNumeroDossier: String,
  patientDateNaissance: Date,
  patientSexe: String,
  dateDeces: { type: String, required: true },
  heureDeces: { type: String, required: true },
  lieuDeces: { type: String, required: true },
  medecin: { type: String, required: true },
  numeroOrdre: String,
  lieuEtablissement: { type: String, required: true },
  observations: String,
  auteurId: { type: String, required: true },
  validePar: String,
  dateValidation: Date,
  statut: { type: String, enum: ['brouillon', 'valide'], default: 'brouillon', required: true },
}, { timestamps: true });

export type ICertificatDeces = InferSchemaType<typeof certificatDecesSchema>;
export const CertificatDeces = mongoose.models.CertificatDeces || mongoose.model('CertificatDeces', certificatDecesSchema);
