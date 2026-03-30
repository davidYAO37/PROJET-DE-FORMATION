import mongoose, { Model, Schema } from "mongoose";

export interface IInventaire extends Document {
    legacyId?: number;
    QteEnStock?: number;
    QteTrouve?: number;
    QtéManquant?: number;
    AuteurModif?: string;
    DateModif?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    entrepriseId?: string;
}


const InventaireSchema = new Schema<IInventaire>(
    {
        legacyId: { type: Number },
        QteEnStock: { type: Number },
        QteTrouve: { type: Number },
        QtéManquant: { type: Number },
        AuteurModif: { type: String, maxlength: 60 },
        DateModif: { type: Date },
        entrepriseId: { type: String },
    },
    { timestamps: true }
);
export const Inventaire: Model<IInventaire> = mongoose.models.Inventaire || mongoose.model<IInventaire>("Inventaire", InventaireSchema);