import mongoose, { Model, Schema, Types } from "mongoose";

export interface IModeDePaiement extends Document {
    _id?: Types.ObjectId | string;
    Modepaiement?: string;
}


const ModeDePaiementSchema = new Schema<IModeDePaiement>({
    Modepaiement: { type: String, maxlength: 50, required: true },
}, { timestamps: true });

export const ModeDePaiement: Model<IModeDePaiement> = mongoose.models.ModeDePaiement || mongoose.model<IModeDePaiement>("ModeDePaiement", ModeDePaiementSchema);