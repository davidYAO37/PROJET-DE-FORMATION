import mongoose, { Model, Schema, Types, } from "mongoose";

export interface IStock extends Document {
    _id?: string;
    Reference?: string;
    QteEnStock?: number;
    QteStockVirtuel?: number;
    AuteurModif?: string;
    DateModif?: Date;
    Medicament?: string;
    IDMEDICAMENT?:Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}


const StockSchema = new Schema<IStock>({
    Reference: { type: String, maxlength: 100 },
    QteEnStock: { type: Number },
    QteStockVirtuel: { type: Number },
    AuteurModif: { type: String, maxlength: 60 },
    DateModif: { type: Date },
    Medicament: { type: String, maxlength: 250 },
    IDMEDICAMENT:{type:Schema.Types.ObjectId,ref:'Pharmacie'}
}, { timestamps: true });
export const Stock: Model<IStock> = mongoose.models.Stock || mongoose.model<IStock>("Stock", StockSchema);  