import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IConstanteHospitalisation extends Document {
  hospitalisationId: Types.ObjectId;
  patientId: Types.ObjectId;
  date: Date;
  heure: string;
  temperature?: number;
  tensionSystole?: number;
  tensionDiastole?: number;
  pouls?: number;
  frequenceRespiratoire?: number;
  spo2?: number;
  glycemie?: number;
  poids?: number;
  taille?: number;
  diurese?: number;
  observation?: string;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConstanteHospitalisationSchema = new Schema<IConstanteHospitalisation>(
  {
    hospitalisationId: { type: Schema.Types.ObjectId, ref: "ExamenHospitalisation", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    heure: { type: String, required: true },
    temperature: { type: Number },
    tensionSystole: { type: Number },
    tensionDiastole: { type: Number },
    pouls: { type: Number },
    frequenceRespiratoire: { type: Number },
    spo2: { type: Number },
    glycemie: { type: Number },
    poids: { type: Number },
    taille: { type: Number },
    diurese: { type: Number },
    observation: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "constantesHospitalisation" }
);

ConstanteHospitalisationSchema.index({ hospitalisationId: 1, date: -1 });
ConstanteHospitalisationSchema.index({ patientId: 1, date: -1 });

export const ConstanteHospitalisation: Model<IConstanteHospitalisation> =
  mongoose.models.ConstanteHospitalisation ||
  mongoose.model<IConstanteHospitalisation>("ConstanteHospitalisation", ConstanteHospitalisationSchema);
