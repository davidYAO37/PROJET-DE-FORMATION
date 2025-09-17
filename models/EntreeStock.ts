import mongoose, { Model, Schema } from "mongoose";
import { Types } from "mongoose";

export interface IEntreeStock extends Document {
    legacyId?: number;
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
    Approvisionnement?: Types.ObjectId | null;
    PrixVente?: number;
    Medicament?: string;
    createdAt?: Date;
    updatedAt?: Date;
}


const EntreeStockSchema = new Schema<IEntreeStock>({
    legacyId: { type: Number },
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
    Approvisionnement: { type: Schema.Types.ObjectId, ref: 'Approvisionnement' },
    PrixVente: { type: Number },
    Medicament: { type: String, maxlength: 250 },
}, { timestamps: true });
export const EntreeStock: Model<IEntreeStock> = mongoose.models.EntreeStock || mongoose.model<IEntreeStock>("EntreeStock", EntreeStockSchema);