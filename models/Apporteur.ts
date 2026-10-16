import mongoose, { Model, Schema } from "mongoose";

export interface IApporteur {
    _id: mongoose.Types.ObjectId | string;
    nom: string;
    telephone?: string;
    taux: number;
    actif: boolean;
    entrepriseId?: string;
}

const ApporteurSchema = new Schema<IApporteur>({
    nom: { type: String, required: true, trim: true },
    telephone: { type: String, trim: true },
    taux: { type: Number, required: true, min: 0, max: 100 },
    actif: { type: Boolean, default: true },
    entrepriseId: { type: String },
}, { timestamps: true });

export const Apporteur: Model<IApporteur> = mongoose.models.Apporteur || mongoose.model<IApporteur>("Apporteur", ApporteurSchema);
