import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDocumentHospitalisation extends Document {
  hospitalisationId: Types.ObjectId;
  patientId: Types.ObjectId;
  titre: string;
  type: string;
  fichier?: Buffer;
  fichierUrl?: string;
  fichierNom?: string;
  fichierType?: string;
  extension?: string;
  description?: string;
  uploadedBy?: Types.ObjectId;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const DocumentHospitalisationSchema = new Schema<IDocumentHospitalisation>(
  {
    hospitalisationId: { type: Schema.Types.ObjectId, ref: "ExamenHospitalisation", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    titre: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["ordonnance", "resultat", "image", "pdf", "compte_rendu", "photo", "administratif", "autre"],
    },
    fichier: { type: Buffer },
    fichierUrl: { type: String },
    fichierNom: { type: String },
    fichierType: { type: String },
    extension: { type: String },
    description: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: "documentsHospitalisation" }
);

DocumentHospitalisationSchema.index({ hospitalisationId: 1, type: 1 });

export const DocumentHospitalisation: Model<IDocumentHospitalisation> =
  mongoose.models.DocumentHospitalisation ||
  mongoose.model<IDocumentHospitalisation>("DocumentHospitalisation", DocumentHospitalisationSchema);
