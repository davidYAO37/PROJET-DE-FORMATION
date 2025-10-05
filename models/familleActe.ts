import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFamilleActe extends Document {
    Description?: string;
}

const FamilleActeSchema = new Schema<IFamilleActe>({
    Description: { type: String, maxlength: 500 },
}, { timestamps: true });

export const FamilleActe: Model<IFamilleActe> = mongoose.models.FamilleActe || mongoose.model<IFamilleActe>("FamilleActe", FamilleActeSchema);