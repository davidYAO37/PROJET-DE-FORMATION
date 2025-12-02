import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IPaiementPartenaire extends Document {
    Assurance?: string;
    DatePaiement?: Date;
    Recupar?: string;
    MontantRecu?: number;
    SaisiLe?: Date;
    SaisiPar?: string;
    Heure?: string;
    FactureAssur?: Types.ObjectId;
    NumChèque?: string;
    BanqueC?: string;
}

const PaiementPartenaireSchema = new Schema<IPaiementPartenaire>({
    Assurance: { type: String, maxlength: 50 },
    DatePaiement: { type: Date },
    Recupar: { type: String, maxlength: 50 },
    MontantRecu: { type: Number },
    SaisiLe: { type: Date },
    SaisiPar: { type: String, maxlength: 40 },
    Heure: { type: String, maxlength: 10 },
    FactureAssur: { type: Schema.Types.ObjectId, ref: 'FactureAssur' },
    NumChèque: { type: String, maxlength: 50 },
    BanqueC: { type: String, maxlength: 50 },
}, { timestamps: true });

export const PaiementPartenaire: Model<IPaiementPartenaire> = mongoose.models.PaiementPartenaire || mongoose.model<IPaiementPartenaire>('PaiementPartenaire', PaiementPartenaireSchema);