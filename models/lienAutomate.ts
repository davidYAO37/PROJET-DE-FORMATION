import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILienAutomate extends Document {
    nLienNFS?: string;
    LienHormone?: string;
    LienVS?: string;
    LienBiochimie?: string;
    entrepriseId?: string;
}

const LienAutomateSchema = new Schema<ILienAutomate>({
    nLienNFS: { type: String, maxlength: 500 },
    LienHormone: { type: String, maxlength: 500 },
    LienVS: { type: String, maxlength: 500 },
    LienBiochimie: { type: String, maxlength: 500 },
    entrepriseId: { type: String },
}, { timestamps: true });

export const LienAutomate: Model<ILienAutomate> = mongoose.models.LienAutomate || mongoose.model<ILienAutomate>("LienAutomate", LienAutomateSchema);