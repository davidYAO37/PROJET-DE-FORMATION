import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IJournalConnexion extends Document {
  userId?: Types.ObjectId;
  entrepriseId?: Types.ObjectId;
  email?: string;
  ip?: string;
  userAgent?: string;
  statut: "success" | "failure" | "locked";
  message?: string;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const JournalConnexionSchema = new Schema<IJournalConnexion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    entrepriseId: { type: Schema.Types.ObjectId, ref: "Entreprise" },
    email: { type: String, maxlength: 200, lowercase: true },
    ip: { type: String, maxlength: 100 },
    userAgent: { type: String, maxlength: 500 },
    statut: {
      type: String,
      enum: ["success", "failure", "locked"],
      required: true,
    },
    message: { type: String, maxlength: 1000 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "journalconnexions" }
);

export const JournalConnexion: Model<IJournalConnexion> =
  (mongoose.models.JournalConnexion as Model<IJournalConnexion>) ||
  mongoose.model<IJournalConnexion>("JournalConnexion", JournalConnexionSchema);
