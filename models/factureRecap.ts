import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IFactureRecap extends Document {
    Numfacture?: string;
    ACTE?: string;
    montantacte?: number;
    Partassure?: number;
    PartAssurance?: number;
    DebutF?: Date;
    FinF?: Date;
    DateSaisie?: Date;
    FactureAssur?: Types.ObjectId;
    Assurance?: string;
    CreePar?: string;
    NCC?: string;
}

const FactureRecapSchema = new Schema<IFactureRecap>({
    Numfacture: { type: String, maxlength: 50 },
    ACTE: { type: String, maxlength: 100 },
    montantacte: { type: Number },
    Partassure: { type: Number },
    PartAssurance: { type: Number },
    DebutF: { type: Date },
    FinF: { type: Date },
    DateSaisie: { type: Date },
    FactureAssur: { type: Schema.Types.ObjectId, ref: 'FactureAssur' },
    Assurance: { type: String, maxlength: 50 },
    CreePar: { type: String, maxlength: 50 },
    NCC: { type: String, maxlength: 100 },
}, { timestamps: true });

export const FactureRecap: Model<IFactureRecap> = mongoose.models.FactureRecap || mongoose.model<IFactureRecap>("FactureRecap", FactureRecapSchema);