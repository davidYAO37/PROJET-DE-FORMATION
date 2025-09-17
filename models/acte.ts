import mongoose, { Schema, Document, Types, Mongoose, Model } from 'mongoose';

export interface IActe extends Document {
    Designation?: string;
    LettreCle?: string;
    IDTYPE_ACTE?: Types.ObjectId;
    CoefficientActe?: number;
    Prix?: number;
    montantacte?: number;
    TYPEACTE?: string;
    PrixMutualiste?: number;
    PrixAssure?: number;
    MontantAuMed?: string;
    resultatacte?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: Types.ObjectId;
    TypeResultat?: number;
    Interpretation?: string;
    ORdonnacementAffichage?: number;
}

const ActeSchema = new Schema<IActe>({
    Designation: { type: String, maxlength: 500 },
    LettreCle: { type: String, maxlength: 10 },
    IDTYPE_ACTE: { type: Schema.Types.ObjectId, ref: 'TypeActe' },
    CoefficientActe: { type: Number },
    Prix: { type: Number },
    montantacte: { type: Number },
    TYPEACTE: { type: String, maxlength: 50 },
    PrixMutualiste: { type: Number },
    PrixAssure: { type: Number },
    MontantAuMed: { type: String, maxlength: 1 },
    resultatacte: { type: String, maxlength: 1000 },
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: 'FamilleActe' },
    TypeResultat: { type: Number },
    Interpretation: { type: String, maxlength: 5000 },
    ORdonnacementAffichage: { type: Number },
}, { timestamps: true });

export const Acte: Model<IActe> = mongoose.models.Acte || mongoose.model<IActe>('Acte', ActeSchema);