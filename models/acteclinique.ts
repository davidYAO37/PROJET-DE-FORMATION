import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActeClinique extends Document {
    designationacte: string;
    lettreCle: string;
    coefficient: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
}

const ActeCliniqueSchema: Schema<IActeClinique> = new Schema({
    designationacte: { type: String, required: true, unique: true },
    lettreCle: { type: String, required: true },
    coefficient: { type: Number, required: true },
    prixClinique: { type: Number, required: true },
    prixMutuel: { type: Number },
    prixPreferentiel: { type: Number },
}, { timestamps: true });
export const ActeClinique: Model<IActeClinique> = mongoose.models.ActeClinique || mongoose.model<IActeClinique>("ActeClinique", ActeCliniqueSchema);