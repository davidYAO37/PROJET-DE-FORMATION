import mongoose, { Model, Schema, Types } from "mongoose";

export interface IPaiementApporteur {
    Apporteur: Types.ObjectId;
    HonoraireApporteur?: Types.ObjectId;
    montant: number;
    resteAPayer?: number;
    date: Date;
    heure?: string;
    modePaiement?: string;
    banque?: string;
    numeroCheque?: string;
    payePar?: string;
    recuPar?: string;
    reference?: string;
    ligneIds: Types.ObjectId[];
    entrepriseId?: string;
}

const PaiementApporteurSchema = new Schema<IPaiementApporteur>({
    Apporteur: { type: Schema.Types.ObjectId, ref: "Apporteur", required: true },
    HonoraireApporteur: { type: Schema.Types.ObjectId, ref: "HonoraireApporteur" },
    montant: { type: Number, required: true },
    resteAPayer: { type: Number },
    date: { type: Date, default: Date.now },
    heure: { type: String },
    modePaiement: { type: String },
    banque: { type: String },
    numeroCheque: { type: String },
    payePar: { type: String },
    recuPar: { type: String },
    reference: { type: String },
    ligneIds: [{ type: Schema.Types.ObjectId, ref: "LignePrestation" }],
    entrepriseId: { type: String },
}, { timestamps: true });

export const PaiementApporteur: Model<IPaiementApporteur> = mongoose.models.PaiementApporteur || mongoose.model<IPaiementApporteur>("PaiementApporteur", PaiementApporteurSchema);
