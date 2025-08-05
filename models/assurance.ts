import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssurance extends Document {
  desiganationassurance: string;
  codeassurance: string;
  telephone: string;
  email: string;

}
const AssuranceSchema: Schema<IAssurance> = new Schema({
  desiganationassurance: { type: String, required: true, unique: true },
  codeassurance: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  email: { type: String, required: true },
},
  { timestamps: true });


export const Assurance: Model<IAssurance> = mongoose.models.Assurance || mongoose.model<IAssurance>("Assurance", AssuranceSchema);

