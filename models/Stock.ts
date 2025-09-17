import mongoose, { Model, Schema } from "mongoose";

export interface IStock extends Document {
    legacyId?: number;
    Reference?: string;
    QteEnStock?: number;
    QteStockVirtuel?: number;
    AuteurModif?: string;
    DateModif?: Date;
    Medicament?: string;
    createdAt?: Date;
    updatedAt?: Date;
}


const StockSchema = new Schema<IStock>({
    legacyId: { type: Number },
    Reference: { type: String, maxlength: 30 },
    QteEnStock: { type: Number },
    QteStockVirtuel: { type: Number },
    AuteurModif: { type: String, maxlength: 60 },
    DateModif: { type: Date },
    Medicament: { type: String, maxlength: 250 },
}, { timestamps: true });
export const Stock: Model<IStock> = mongoose.models.StockModel || mongoose.model<IStock>("Stock", StockSchema);  