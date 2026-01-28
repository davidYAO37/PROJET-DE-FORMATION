import mongoose, { Model, Schema } from "mongoose";
import { Types } from "mongoose";

export interface IEntreeStock extends Document {
     _id:string;
    DateAppro?: Date;
    Quantite?: number;
    PrixAchat?: number;
    PRIXTHT?: number;
    TVAEntree?: number;
    MontantTTCE?: number;
    SaisiPar?: string;
    SaisiLe?: Date;
    Observations?: string;
    Reference?: string;
    IDAppro?: Types.ObjectId | null;
    PrixVente?: number;
    Medicament?: string;
    IDMEDICAMENT?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}


const EntreeStockSchema = new Schema<IEntreeStock>({
    DateAppro: { type: Date },
    Quantite: { type: Number },
    PrixAchat: { type: Number },
    PRIXTHT: { type: Number },
    TVAEntree: { type: Number },
    MontantTTCE: { type: Number },
    SaisiPar: { type: String, maxlength: 40 },
    SaisiLe: { type: Date },
    Observations: { type: String, maxlength: 120 },
    Reference: { type: String, maxlength: 30 },
    IDAppro: { type: Schema.Types.ObjectId, ref: 'Approvisionnement' },
    PrixVente: { type: Number },
    Medicament: { type: String, maxlength: 250 },
    IDMEDICAMENT: { type: Schema.Types.ObjectId, ref: 'Pharmacie' },
}, { timestamps: true });
export const EntreeStock: Model<IEntreeStock> = mongoose.models.EntreeStock || mongoose.model<IEntreeStock>("EntreeStock", EntreeStockSchema);