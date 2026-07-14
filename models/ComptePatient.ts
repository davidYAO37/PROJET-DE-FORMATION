import mongoose, { Schema, Document, Model } from "mongoose";

export type TypeCompte = "Paiement" | "Remboursement";

export interface IComptePatient extends Document {
    DateAjout?: Date;
    MontantClient?: number;
    TypeCompte?: TypeCompte;
    ModePaiement?: string;
    RecuDe?: string;
    IDPARTIENT?: mongoose.Types.ObjectId;
    RecuPar?: string;
    MotifCompte?: string;
    entrepriseId?: string;
}

const ComptePatientSchema: Schema = new Schema({
    DateAjout: { type: Date, default: Date.now },
    MontantClient: { type: Number, required: true },
    TypeCompte: { type: String, enum: ["Paiement", "Remboursement"], default: "Paiement" },
    ModePaiement: { type: String, maxlength: 100 },
    RecuDe: { type: String, maxlength: 150 },
    IDPARTIENT: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    RecuPar: { type: String, maxlength: 100 },
    MotifCompte: { type: String, maxlength: 255 },
    entrepriseId: { type: String },
});

export const ComptePatient: Model<IComptePatient> = mongoose.models.ComptePatient || mongoose.model<IComptePatient>("ComptePatient", ComptePatientSchema);
