import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConsultation extends Document {
  patient: mongoose.Types.ObjectId;
  medecin: mongoose.Types.ObjectId;
  date: Date;
  motif: string;
  tarif: number;
}

const ConsultationSchema = new Schema<IConsultation>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    medecin: { type: Schema.Types.ObjectId, ref: "Medecin", required: true },
    date: { type: Date, required: true },
    motif: { type: String, required: true },
    tarif: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Consultation: Model<IConsultation> =
  mongoose.models.Consultation || mongoose.model<IConsultation>("Consultation", ConsultationSchema);
