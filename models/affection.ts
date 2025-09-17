import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAffection extends Document {
    designation: string;
    lettreCle: string;
}

const AffectionSchema = new Schema<IAffection>({
    designation: { type: String, required: true },
    lettreCle: { type: String, required: true },
});

export default mongoose.models.Affection || mongoose.model<IAffection>("Affection", AffectionSchema);
