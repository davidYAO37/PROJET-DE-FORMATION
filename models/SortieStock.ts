import mongoose, { Model, Schema, Types } from "mongoose";

export interface ISortieStock extends Document {
    legacyId?: number;
    DateSortie?: Date;
    Reference?: string;
    Quantite?: number;
    Prix_unitaire?: number;
    Prix_TotalS?: number;
    Motif?: string;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: Date;
    ArticleS?: string;
    Prescription?: Types.ObjectId | null;
    Patient?: Types.ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
}


const SortieStockSchema = new Schema<ISortieStock>({
    legacyId: { type: Number },
    DateSortie: { type: Date },
    Reference: { type: String, maxlength: 30 },
    Quantite: { type: Number },
    Prix_unitaire: { type: Number },
    Prix_TotalS: { type: Number },
    Motif: { type: String, maxlength: 40 },
    Observations: { type: String, maxlength: 120 },
    SaisiPar: { type: String, maxlength: 40 },
    SaisiLe: { type: Date },
    ArticleS: { type: String, maxlength: 60 },
    Prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    Patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
}, { timestamps: true });
export const SortieStock: Model<ISortieStock> = mongoose.models.SortieStockModel || mongoose.model<ISortieStock>("SortieStock", SortieStockSchema);