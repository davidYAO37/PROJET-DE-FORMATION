import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITypeActe extends Document {
    Designation: string;
    Hospitalisation: boolean;
}

const TypeActeSchema: Schema = new Schema({
    Designation: { type: String },
    Hospitalisation: { type: Boolean, default: false },
});

export const TypeActe: Model<ITypeActe> = mongoose.models.TypeActe || mongoose.model<ITypeActe>('TypeActe', TypeActeSchema);