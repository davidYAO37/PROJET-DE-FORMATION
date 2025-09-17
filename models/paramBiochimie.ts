import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParamBiochimie extends Document {
    CodeB?: string;
    LibelleB?: string;
}

const ParamBiochimieSchema = new Schema<IParamBiochimie>({
    CodeB: { type: String, maxlength: 10 },
    LibelleB: { type: String, maxlength: 150 },
}, { timestamps: true });

export const ParamBiochimie: Model<IParamBiochimie> = mongoose.models.ParamBiochimie || mongoose.model<IParamBiochimie>('ParamBiochimie', ParamBiochimieSchema);