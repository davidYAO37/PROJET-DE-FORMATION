import mongoose, { Model, Schema, Types } from "mongoose";
import { IInventaire } from "./inventaire";

export interface ILigneInventaire extends Document {
    legacyIdInventaire?: number;
    Reference?: string;
    FAMILLEC?: string;
    LibeleProduit?: string;
    StockMachine?: number;
    StockTrouver?: number;
    Manquant?: number;
    Dateinventaire?: Date;
    ObservationC?: string;
    Inventaire?: Types.ObjectId | IInventaire | null;
    createdAt?: Date;
    updatedAt?: Date;
}


const LigneInventaireSchema = new Schema<ILigneInventaire>(
    {
        legacyIdInventaire: { type: Number },
        Reference: { type: String, maxlength: 30 },
        FAMILLEC: { type: String, maxlength: 60 },
        LibeleProduit: { type: String, maxlength: 50 },
        StockMachine: { type: Number },
        StockTrouver: { type: Number },
        Manquant: { type: Number },
        Dateinventaire: { type: Date },
        ObservationC: { type: String, maxlength: 120 },
        Inventaire: { type: Schema.Types.ObjectId, ref: 'Inventaire' },
    },
    { timestamps: true }
);
export const LigneInventaire: Model<IInventaire> = mongoose.models.LigneInventaireModel || mongoose.model<ILigneInventaire>("LigneInventaire", LigneInventaireSchema);