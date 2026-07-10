import mongoose, { Model, Schema, Types } from "mongoose";

export interface IApprovisionnement extends Omit<Document, '_id'> {
    _id?: string;
    DateAppro?: string | Date;
    PrixHT?: number;
    tVAApro?: number;
    Transport?: number;
    MontantTTC?: number;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: string | Date;
    IDFournisseur?: Types.ObjectId | string | null;
    NomFournisseur?: string;
    NumeroFacture?: string;
    entrepriseId?: string;
}

const ApprovisionnementSchema = new Schema<IApprovisionnement>({
    DateAppro:      { type: Date },
    PrixHT:         { type: Number },
    tVAApro:        { type: Number },
    Transport:      { type: Number },
    MontantTTC:     { type: Number },
    Observations:   { type: String, maxlength: 120 },
    SaisiPar:       { type: String, maxlength: 40 },
    SaisiLe:        { type: Date },
    IDFournisseur:  { type: Schema.Types.ObjectId, ref: 'Fournisseur', required: false },
    NomFournisseur: { type: String, maxlength: 120 },
    NumeroFacture:  { type: String, maxlength: 60 },
    entrepriseId:   { type: String },
}, { timestamps: true });
export const Approvisionnement: Model<IApprovisionnement> = mongoose.models.Approvisionnement || mongoose.model<IApprovisionnement>("Approvisionnement", ApprovisionnementSchema);