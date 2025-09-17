import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILenAutomate extends Document {
    nLienNFS?: string;
    LienHormone?: string;
    LienVS?: string;
    LienBiochimie?: string;
}

const LenAutomateSchema = new Schema<ILenAutomate>({
    nLienNFS: { type: String, maxlength: 500 },
    LienHormone: { type: String, maxlength: 500 },
    LienVS: { type: String, maxlength: 500 },
    LienBiochimie: { type: String, maxlength: 500 },
}, { timestamps: true });

export const LenAutomate: Model<ILenAutomate> = mongoose.models.LenAutomate || mongoose.model<ILenAutomate>("LenAutomate", LenAutomateSchema);