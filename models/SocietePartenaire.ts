import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface ISocietePartenaire extends Document {
    Designation?: string;
    IDPROFORMACLIENT?: number;
    IDPROFORMA?: number;
    IDCLIENT_PROFORMA?: number;
    ACTEF?: string;
    CoefficientActe?: number;
    Qte?: number;
    prixunitaire?: number;
    PrixTotal?: number;
    IDACTE?: Types.ObjectId;
}

const SocietePartenaireSchema = new Schema<ISocietePartenaire>({
    Designation: { type: String, maxlength: 500 },
    IDPROFORMACLIENT: { type: Number },
    IDPROFORMA: { type: Number },
    IDCLIENT_PROFORMA: { type: Number },
    ACTEF: { type: String, maxlength: 100 },
    CoefficientActe: { type: Number },
    Qte: { type: Number },
    prixunitaire: { type: Number },
    PrixTotal: { type: Number },
    IDACTE: { type: Schema.Types.ObjectId, ref: 'Acte' },
}, { timestamps: true });

export const SocietePartenaire: Model<ISocietePartenaire> = mongoose.model<ISocietePartenaire>('SocietePartenaire', SocietePartenaireSchema);