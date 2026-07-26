import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IEvolutionMedicaleHospitalisation extends Document {
  hospitalisationId: Types.ObjectId;
  patientId: Types.ObjectId;
  medecinId?: Types.ObjectId;
  date: Date;
  heure: string;
  observation: string;
  decision?: string;
  ordonnance?: string;
  etatPatient?: string;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const EvolutionMedicaleHospitalisationSchema = new Schema<IEvolutionMedicaleHospitalisation>(
  {
    hospitalisationId: { type: Schema.Types.ObjectId, ref: "ExamenHospitalisation", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    medecinId: { type: Schema.Types.ObjectId, ref: "Medecin" },
    date: { type: Date, required: true, default: Date.now },
    heure: { type: String, required: true },
    observation: { type: String, required: true },
    decision: { type: String },
    ordonnance: { type: String },
    etatPatient: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "evolutionsMedicalesHospitalisation" }
);

EvolutionMedicaleHospitalisationSchema.index({ hospitalisationId: 1, date: -1 });

export const EvolutionMedicaleHospitalisation: Model<IEvolutionMedicaleHospitalisation> =
  mongoose.models.EvolutionMedicaleHospitalisation ||
  mongoose.model<IEvolutionMedicaleHospitalisation>(
    "EvolutionMedicaleHospitalisation",
    EvolutionMedicaleHospitalisationSchema
  );
