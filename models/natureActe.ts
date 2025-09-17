import mongoose, { Schema, Document, Model } from "mongoose";

export interface INatureActe extends Document {
    designation: string;
    code: string;
    famille?: string;
    type?: string; // HOSPITALISATION, BIOLOGIE, etc.
}

const NatureActeSchema = new Schema<INatureActe>({
    designation: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    famille: String,
    type: String,
});

export const NatureActe: Model<INatureActe> = mongoose.models.NatureActe || mongoose.model<INatureActe>("NatureActe", NatureActeSchema);
