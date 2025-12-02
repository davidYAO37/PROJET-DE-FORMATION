import mongoose, { Schema, Document, Model } from "mongoose";


export interface IAssurance extends Document {
  _id: mongoose.Types.ObjectId | string;
  desiganationassurance: string;
  codeassurance: string;
  telephone: string;
  email: string;
  societes?: mongoose.Types.ObjectId[]; // Liste des sociétés liées
}

const AssuranceSchema: Schema<IAssurance> = new Schema({
  desiganationassurance: { type: String, required: true, unique: true },
  codeassurance: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  email: { type: String, required: true },
  societes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SocieteAssurance' }],
},
  { timestamps: true });

export const Assurance: Model<IAssurance> = mongoose.models.Assurance || mongoose.model<IAssurance>("Assurance", AssuranceSchema);

