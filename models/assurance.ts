import mongoose, { Schema, Document, Model } from "mongoose";


export interface IAssurance extends Omit<Document, '_id'> {
  _id: mongoose.Types.ObjectId | string;
  designationassurance: string;
  codeassurance: string;
  telephone: string;
  email: string;
  NCC?: string;
  accepteSurplus?: boolean; // true = avec surplus (comportement actuel), false = sans surplus
  societes?: mongoose.Types.ObjectId[]; // Liste des sociétés liées
}

const AssuranceSchema: Schema<IAssurance> = new Schema({
  designationassurance: { type: String, required: true, unique: true },
  codeassurance: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  email: { type: String, required: true },
  NCC: { type: String, maxlength: 100 },
  accepteSurplus: { type: Boolean, default: true },
  societes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SocieteAssurance' }],
},
  { timestamps: true });

export const Assurance: Model<IAssurance> = mongoose.models.Assurance || mongoose.model<IAssurance>("Assurance", AssuranceSchema);

