import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParametreNfs extends Document {
    PARAMETRE?: string;
    DESCRIPTION?: string;
}

const ParametreNfsSchema = new Schema<IParametreNfs>({
    PARAMETRE: { type: String, maxlength: 300 },
    DESCRIPTION: { type: String, maxlength: 500 },
}, { timestamps: true });

export const ParametreNfs: Model<IParametreNfs> = mongoose.models.ParametreNfs || mongoose.model<IParametreNfs>('ParametreNfs', ParametreNfsSchema);