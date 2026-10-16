import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IJournalAction extends Document {
  /** Utilisateur ayant effectué l'action (admin / délégué). */
  actorId?: Types.ObjectId;
  actorEmail?: string;
  actorType?: string;
  entrepriseId?: Types.ObjectId;
  /** Type d'action auditée (ex: "permissions_changed"). */
  action: string;
  /** Utilisateur cible de l'action. */
  targetUserId?: Types.ObjectId;
  targetEmail?: string;
  /** Détail de l'ancien / nouvel état (JSON sérialisé, jamais de secret). */
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const JournalActionSchema = new Schema<IJournalAction>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String, maxlength: 200, lowercase: true },
    actorType: { type: String, maxlength: 50 },
    entrepriseId: { type: Schema.Types.ObjectId, ref: "Entreprise" },
    action: { type: String, required: true, maxlength: 100 },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User" },
    targetEmail: { type: String, maxlength: 200, lowercase: true },
    details: { type: Schema.Types.Mixed },
    ip: { type: String, maxlength: 100 },
    userAgent: { type: String, maxlength: 500 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "journalactions" }
);

export const JournalAction: Model<IJournalAction> =
  (mongoose.models.JournalAction as Model<IJournalAction>) ||
  mongoose.model<IJournalAction>("JournalAction", JournalActionSchema);
