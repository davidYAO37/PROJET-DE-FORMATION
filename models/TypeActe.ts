import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITypeActe extends Document {
    Designation: string;
}

const TypeActeSchema: Schema = new Schema({
    Designation: { type: String },
});

export const TypeActe: Model<ITypeActe> = mongoose.models.TypeActe || mongoose.model<ITypeActe>('TypeActe', TypeActeSchema);