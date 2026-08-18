import mongoose, { Model, Schema } from "mongoose";


export type TypeArticle = "PHARMACIE" | "LABORATOIRE";
export type TypeConditionnement = "BOITE" | "FLACON" | "TUBE" | "AMPLOULE" | "SACHET" | "AUTRE";

export interface IPharmacie extends Omit<Document, '_id'> {
    _id?: string;
    Reference?: string;
    Designation: string;
    PrixAchat?: number;
    PrixVente?: number;
    TypeArticle?: TypeArticle;
    ConditionnementAchat?: TypeConditionnement;
    QteParConditionnement?: number;
    UniteVente?: string;
    PrixAchatConditionnement?: number;
    PrixVenteConditionnement?: number;
    PrixVenteUnite?: number;
    VenteParDetail?: boolean;
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
        ConditionnementAchat: { type: String, enum: ["BOITE", "FLACON", "TUBE", "AMPLOULE", "SACHET", "AUTRE"] },
        QteParConditionnement: { type: Number, default: 1 },
        UniteVente: { type: String, maxlength: 50 },
        PrixAchatConditionnement: { type: Number },
        PrixVenteConditionnement: { type: Number },
        PrixVenteUnite: { type: Number },
        VenteParDetail: { type: Boolean, default: false },
        Ajouter: { type: Date },
        entrepriseId: { type: String },
    },
    { timestamps: true }
);
export const Pharmacie: Model<IPharmacie> = mongoose.models.Pharmacie || mongoose.model<IPharmacie>('Pharmacie', PharmacieSchema);