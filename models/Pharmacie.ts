import mongoose, { Model, Schema } from "mongoose";


export type TypeArticle = "PHARMACIE" | "LABORATOIRE";

export interface IPharmacie extends Omit<Document, '_id'> {
    _id?: string;
    Reference?: string;
    Designation: string;
    PrixAchat?: number;
    PrixVente?: number;
    TypeArticle?: TypeArticle;
    Ajouter?: Date;
    entrepriseId?: string;
}


const PharmacieSchema = new Schema<IPharmacie>(
    {
        Reference: { type: String, maxlength: 100 },
        Designation: { type: String, maxlength: 500, required: true },
        PrixAchat: { type: Number },
        PrixVente: { type: Number },
        TypeArticle: { type: String, enum: ["PHARMACIE", "LABORATOIRE"], default: "PHARMACIE" },
        Ajouter: { type: Date },
        entrepriseId: { type: String },
    },
    { timestamps: true }
);
export const Pharmacie: Model<IPharmacie> = mongoose.models.Pharmacie || mongoose.model<IPharmacie>('Pharmacie', PharmacieSchema);