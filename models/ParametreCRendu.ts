import mongoose, { Schema, Document, Model } from "mongoose";

export interface IParametreCRendu extends Document {
    LettreCle: string;
    Date: Date;
    AjouterPar: string;
    HeureAjoute: string;
}

const ParametreCRenduSchema: Schema = new Schema({
    LettreCle: { type: String },
    Date: { type: Date },
    AjouterPar: { type: String },
    HeureAjoute: { type: String },
});
export const ParametreCRendu: Model<IParametreCRendu> = mongoose.models.ParametreCRendu || mongoose.model<IParametreCRendu>("ParametreCRendu", ParametreCRenduSchema);