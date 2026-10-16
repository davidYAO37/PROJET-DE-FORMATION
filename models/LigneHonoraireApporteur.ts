import mongoose, { Model, Schema, Types } from "mongoose";

export interface ILigneHonoraireApporteur {
    HonoraireApporteur: Types.ObjectId;
    LignePrestation: Types.ObjectId;
    date: Date;
    prestation: string;
    patient?: string;
    montantActe: number;
    taux: number;
    netAPayer: number;
    entrepriseId?: string;
}

const LigneHonoraireApporteurSchema = new Schema<ILigneHonoraireApporteur>({
    HonoraireApporteur: { type: Schema.Types.ObjectId, ref: "HonoraireApporteur", required: true },
    LignePrestation: { type: Schema.Types.ObjectId, ref: "LignePrestation", required: true },
    date: { type: Date, required: true },
    prestation: { type: String, required: true },
    patient: { type: String },
    montantActe: { type: Number, default: 0 },
    taux: { type: Number, default: 0 },
    netAPayer: { type: Number, default: 0 },
    entrepriseId: { type: String },
}, { timestamps: true });

export const LigneHonoraireApporteur: Model<ILigneHonoraireApporteur> = mongoose.models.LigneHonoraireApporteur || mongoose.model<ILigneHonoraireApporteur>("LigneHonoraireApporteur", LigneHonoraireApporteurSchema);
