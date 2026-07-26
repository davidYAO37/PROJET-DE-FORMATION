import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMouvementHospitalisation extends Document {
  hospitalisationId: Types.ObjectId;
  patientId: Types.ObjectId;
  type: "admission" | "transfert" | "sortie" | "deces";
  date: Date;
  heure: string;
  chambreIdSource?: Types.ObjectId;
  litIdSource?: Types.ObjectId;
  chambreIdCible?: Types.ObjectId;
  litIdCible?: Types.ObjectId;
  auteurId?: Types.ObjectId;
  motif?: string;
  observation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MouvementHospitalisationSchema = new Schema<IMouvementHospitalisation>(
  {
    hospitalisationId: { type: Schema.Types.ObjectId, ref: "ExamenHospitalisation", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["admission", "transfert", "sortie", "deces"],
    },
    date: { type: Date, required: true, default: Date.now },
    heure: { type: String, required: true },
    chambreIdSource: { type: Schema.Types.ObjectId, ref: "Chambre" },
    litIdSource: { type: Schema.Types.ObjectId, ref: "Lit" },
    chambreIdCible: { type: Schema.Types.ObjectId, ref: "Chambre" },
    litIdCible: { type: Schema.Types.ObjectId, ref: "Lit" },
    auteurId: { type: Schema.Types.ObjectId, ref: "User" },
    motif: { type: String },
    observation: { type: String },
  },
  { timestamps: true, collection: "mouvementsHospitalisation" }
);

MouvementHospitalisationSchema.index({ hospitalisationId: 1, date: -1 });

export const MouvementHospitalisation: Model<IMouvementHospitalisation> =
  mongoose.models.MouvementHospitalisation ||
  mongoose.model<IMouvementHospitalisation>("MouvementHospitalisation", MouvementHospitalisationSchema);
