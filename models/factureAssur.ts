import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IFactureAssur extends Document {
    Reference?: string;
    Saisirpar?: string;
    Date?: Date;
    etat_facture?: boolean;
    DateDepot?: Date;
    DepotPar?: string;
    DateRetrait?: Date;
    RetirePar?: string;
    NumChèque?: string;
    MontantTotalFacture?: number;
    Partassure?: number;
    PartAssurance?: number;
    DebutF?: Date;
    FinF?: Date;
    Assuance?: string;
    TYPEACTE?: string;
    TotalPaye?: number;
    Restapayer?: number;
}

const FactureAssurSchema = new Schema<IFactureAssur>({
    Reference: { type: String, maxlength: 30 },
    Saisirpar: { type: String, maxlength: 60 },
    Date: { type: Date },
    etat_facture: { type: Boolean, default: false },
    DateDepot: { type: Date },
    DepotPar: { type: String, maxlength: 100 },
    DateRetrait: { type: Date },
    RetirePar: { type: String, maxlength: 150 },
    NumChèque: { type: String, maxlength: 50 },
    MontantTotalFacture: { type: Number },
    Partassure: { type: Number },
    PartAssurance: { type: Number },
    DebutF: { type: Date },
    FinF: { type: Date },
    Assuance: { type: String, maxlength: 50 },
    TYPEACTE: { type: String, maxlength: 50 },
    TotalPaye: { type: Number },
    Restapayer: { type: Number },
}, { timestamps: true });

export const FacturationAssur: Model<IFactureAssur> = mongoose.models.FactureAssur || mongoose.model<IFactureAssur>("FactureAssur", FactureAssurSchema);