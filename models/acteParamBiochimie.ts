import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IActeParamBiochimie extends Document {
    IDPARAM_BIOCHIME?: Types.ObjectId;
    IDACTEP?: Types.ObjectId;
    param_designb?: string;
}

const ActeParamBiochimieSchema = new Schema<IActeParamBiochimie>({
    IDPARAM_BIOCHIME: { type: Schema.Types.ObjectId, ref: 'ParamBiochimie', required: true },
    IDACTEP: { type: Schema.Types.ObjectId, ref: 'Acte', required: true },
    param_designb: { type: String, maxlength: 150 },
}, { timestamps: true });

export const ActeParamBiochimie: Model<IActeParamBiochimie> = mongoose.models.ActeParamBiochimie || mongoose.model<IActeParamBiochimie>('ActeParamBiochimie', ActeParamBiochimieSchema);