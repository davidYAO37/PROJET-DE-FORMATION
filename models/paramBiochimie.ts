import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParamBiochimie extends Document {
    _id: string;
    CodeB?: string;
    LibelleB?: string;
}

const ParamBiochimieSchema = new Schema<IParamBiochimie>({
    CodeB: { type: String, maxlength: 10, unique: true },
    LibelleB: { type: String, maxlength: 500, required: true },
}, { timestamps: true });

export const ParamBiochimie: Model<IParamBiochimie> = mongoose.models.ParamBiochimie || mongoose.model<IParamBiochimie>('ParamBiochimie', ParamBiochimieSchema);