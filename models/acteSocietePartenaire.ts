import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IActeSocietePartenaire extends Document {
    IDSOCIETEPARTENAIRE?: Types.ObjectId;
    IDACTEP?: Types.ObjectId;
    LettreCle?: string;
    Prix?: number;
    CoefficientActe?: number;
    PrixTotal?: number;
    IDFAMILLE_ACTE_BIOLOGIE?: Types.ObjectId;
}

const ActeSocietePartenaireSchema = new Schema<IActeSocietePartenaire>({
    IDSOCIETEPARTENAIRE: { type: Schema.Types.ObjectId, ref: 'SocietePartenaire' },
    IDACTEP: { type: Schema.Types.ObjectId, ref: 'Acte' },
    LettreCle: { type: String, maxlength: 10 },
    Prix: { type: Number },
    CoefficientActe: { type: Number },
    PrixTotal: { type: Number },
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: 'FamilleActe' },
}, { timestamps: true });

export const ActeSocietePartenaire: Model<IActeSocietePartenaire> = mongoose.models.ActeSocietePartenaire || mongoose.model<IActeSocietePartenaire>('ActeSocietePartenaire', ActeSocietePartenaireSchema);