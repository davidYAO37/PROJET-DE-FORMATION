import mongoose, { Model, Schema, Types } from "mongoose";

export interface IHonoraireApporteur {
    Apporteur: Types.ObjectId;
    date: Date;
    debut: Date;
    fin: Date;
    nombreActes: number;
    montantTotalActes: number;
    taux: number;
    totalNetAPayer: number;
    montantPaye: number;
    resteAPayer: number;
    annule: boolean;
    entrepriseId?: string;
}

const HonoraireApporteurSchema = new Schema<IHonoraireApporteur>({
    Apporteur: { type: Schema.Types.ObjectId, ref: "Apporteur", required: true },
    date: { type: Date, default: Date.now },
    debut: { type: Date, required: true },
    fin: { type: Date, required: true },
    nombreActes: { type: Number, default: 0 },
    montantTotalActes: { type: Number, default: 0 },
    taux: { type: Number, default: 0 },
    totalNetAPayer: { type: Number, default: 0 },
    montantPaye: { type: Number, default: 0 },
    resteAPayer: { type: Number, default: 0 },
    annule: { type: Boolean, default: false },
    entrepriseId: { type: String },
}, { timestamps: true });

export const HonoraireApporteur: Model<IHonoraireApporteur> = mongoose.models.HonoraireApporteur || mongoose.model<IHonoraireApporteur>("HonoraireApporteur", HonoraireApporteurSchema);
