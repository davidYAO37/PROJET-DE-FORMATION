import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPrescriptionHospitalisation extends Document {
  hospitalisationId: Types.ObjectId;
  patientId: Types.ObjectId;
  medicament: string;
  dosage: string;
  voie: string;
  frequence: string;
  duree: string;
  quantite: number;
  heureAdministration?: string;
  administrer?: boolean;
  administrerPar?: Types.ObjectId;
  administrerLe?: Date;
  medecinId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  statut: "en_attente" | "administre" | "annule";
  dateDebut?: Date;
  dateFin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PrescriptionHospitalisationSchema = new Schema<IPrescriptionHospitalisation>(
  {
    hospitalisationId: { type: Schema.Types.ObjectId, ref: "ExamenHospitalisation", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    medicament: { type: String, required: true },
    dosage: { type: String, required: true },
    voie: { type: String },
    frequence: { type: String },
    duree: { type: String },
    quantite: { type: Number, default: 0 },
    heureAdministration: { type: String },
    administrer: { type: Boolean, default: false },
    administrerPar: { type: Schema.Types.ObjectId, ref: "User" },
    administrerLe: { type: Date },
    medecinId: { type: Schema.Types.ObjectId, ref: "Medecin" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    statut: { type: String, enum: ["en_attente", "administre", "annule"], default: "en_attente" },
    dateDebut: { type: Date, default: Date.now },
    dateFin: { type: Date },
  },
  { timestamps: true, collection: "prescriptionsHospitalisation" }
);

PrescriptionHospitalisationSchema.index({ hospitalisationId: 1, statut: 1 });

export const PrescriptionHospitalisation: Model<IPrescriptionHospitalisation> =
  mongoose.models.PrescriptionHospitalisation ||
  mongoose.model<IPrescriptionHospitalisation>("PrescriptionHospitalisation", PrescriptionHospitalisationSchema);
