import mongoose, { Model, Schema } from "mongoose";

export interface IActeParametre extends Document {
    Designation: string;
}

const ActeParametreSchema = new Schema<IActeParametre>({
    Designation: { type: String, required: true }
}, { timestamps: true });
export const ActeParametre: Model<IActeParametre> = mongoose.models.ActeParametre || mongoose.model<IActeParametre>("ActeParametre", ActeParametreSchema);