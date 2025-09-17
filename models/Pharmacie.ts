import mongoose, { Model, Schema } from "mongoose";


export interface IPharmacie extends Document {
    legacyId?: number;
    Reference?: string;
    Designation: string;
    Prix?: number;
    PrixVente?: number;
    Ajouter?: Date;
}


const PharmacieSchema = new Schema<IPharmacie>(
    {
        legacyId: { type: Number },
        Reference: { type: String, maxlength: 30 },
        Designation: { type: String, maxlength: 500, required: true },
        Prix: { type: Number },
        PrixVente: { type: Number },
        Ajouter: { type: Date },
    },
    { timestamps: true }
);
export const Pharmacie: Model<IPharmacie> = mongoose.models.Pharmacie || mongoose.model<IPharmacie>('Pharmacie', PharmacieSchema);