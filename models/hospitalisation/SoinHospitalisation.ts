import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISoinHospitalisation extends Document {
  hospitalisationId: Types.ObjectId;
  patientId: Types.ObjectId;
  type: string;
  description: string;
  date: Date;
  heure: string;
  observation?: string;
  validation?: {
    valide: boolean;
    validePar?: Types.ObjectId;
    valideLe?: Date;
  };
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const SoinHospitalisationSchema = new Schema<ISoinHospitalisation>(
  {
    hospitalisationId: { type: Schema.Types.ObjectId, ref: "ExamenHospitalisation", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["perfusion", "injection", "pansement", "oxygene", "sonde", "observation", "prelevement", "autre"],
    },
    description: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    heure: { type: String, required: true },
    observation: { type: String },
    validation: {
      valide: { type: Boolean, default: false },
      validePar: { type: Schema.Types.ObjectId, ref: "User" },
      valideLe: { type: Date },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "soinsHospitalisation" }
);

SoinHospitalisationSchema.index({ hospitalisationId: 1, date: -1 });

export const SoinHospitalisation: Model<ISoinHospitalisation> =
  mongoose.models.SoinHospitalisation ||
  mongoose.model<ISoinHospitalisation>("SoinHospitalisation", SoinHospitalisationSchema);
