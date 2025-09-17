import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFamilleActe extends Document {
    DESCRIPTION?: string;
}

const FamilleActeSchema = new Schema<IFamilleActe>({
    DESCRIPTION: { type: String, maxlength: 500 },
}, { timestamps: true });

export const FamilleActe: Model<IFamilleActe> = mongoose.models.FamilleActe || mongoose.model<IFamilleActe>("FamilleActe", FamilleActeSchema);