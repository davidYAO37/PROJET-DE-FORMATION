import mongoose, { Model, Schema } from "mongoose";

export interface IModeDePaiement extends Document {
    legacyId?: number;
    Modepaiement: string;
    createdAt?: Date;
    updatedAt?: Date;
}


const ModeDePaiementSchema = new Schema<IModeDePaiement>({
    legacyId: { type: Number },
    Modepaiement: { type: String, maxlength: 50, required: true },
}, { timestamps: true });

export const ModeDePaiement: Model<IModeDePaiement> = mongoose.models.ModeDePaiement || mongoose.model<IModeDePaiement>("ModeDePaiement", ModeDePaiementSchema);