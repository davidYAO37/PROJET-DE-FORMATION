import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInfirmier extends Omit<Document, '_id'> {
  _id: mongoose.Types.ObjectId | string;
  nom: string;
  prenoms: string;
  service?: string;
  EmailInf: string;
  telephone?: string;
  grade?: string;
  entrepriseId?: string;
  userId?: mongoose.Types.ObjectId;
}

const InfirmierSchema = new Schema<IInfirmier>(
  {
    nom:          { type: String, required: true },
    prenoms:      { type: String, required: true },
    service:      { type: String },
    EmailInf:     { type: String },
    telephone:    { type: String },
    grade:        { type: String },
    entrepriseId: { type: String },
    userId:       { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Infirmier: Model<IInfirmier> =
  mongoose.models.Infirmier || mongoose.model<IInfirmier>("Infirmier", InfirmierSchema);
