import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFactureHospitalisation extends Document {
  hospitalisationId: Types.ObjectId;
  patientId: Types.ObjectId;
  numeroFacture: string;
  dateEmission: Date;
  dateSortie?: Date;
  lignes: Array<{
    type: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
  }>;
  montantChambre: number;
  nombreJours: number;
  montantActes: number;
  montantExamens: number;
  montantMedicaments: number;
  montantSoins: number;
  montantHonoraires: number;
  remise: number;
  totalGeneral: number;
  partAssurance: number;
  partPatient: number;
  dejaPaye: number;
  resteAPayer: number;
  statut: "brouillon" | "validee" | "payee" | "annulee";
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const LigneFactureHospitalisationSchema = new Schema(
  {
    type: { type: String, required: true },
    designation: { type: String, required: true },
    quantite: { type: Number, required: true, default: 1 },
    prixUnitaire: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const FactureHospitalisationSchema = new Schema<IFactureHospitalisation>(
  {
    hospitalisationId: { type: Schema.Types.ObjectId, ref: "ExamenHospitalisation", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    numeroFacture: { type: String, required: true, index: true },
    dateEmission: { type: Date, required: true, default: Date.now },
    dateSortie: { type: Date },
    lignes: { type: [LigneFactureHospitalisationSchema], default: [] },
    montantChambre: { type: Number, default: 0 },
    nombreJours: { type: Number, default: 0 },
    montantActes: { type: Number, default: 0 },
    montantExamens: { type: Number, default: 0 },
    montantMedicaments: { type: Number, default: 0 },
    montantSoins: { type: Number, default: 0 },
    montantHonoraires: { type: Number, default: 0 },
    remise: { type: Number, default: 0 },
    totalGeneral: { type: Number, default: 0 },
    partAssurance: { type: Number, default: 0 },
    partPatient: { type: Number, default: 0 },
    dejaPaye: { type: Number, default: 0 },
    resteAPayer: { type: Number, default: 0 },
    statut: {
      type: String,
      enum: ["brouillon", "validee", "payee", "annulee"],
      default: "brouillon",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "facturesHospitalisation" }
);

FactureHospitalisationSchema.index({ hospitalisationId: 1, statut: 1 });

export const FactureHospitalisation: Model<IFactureHospitalisation> =
  mongoose.models.FactureHospitalisation ||
  mongoose.model<IFactureHospitalisation>("FactureHospitalisation", FactureHospitalisationSchema);
