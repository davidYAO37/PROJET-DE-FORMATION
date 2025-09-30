import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActeClinique extends Document {
    _id: string;
    designationacte: string;
    lettreCle: string;
    coefficient: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    IDTYPE_ACTE?: mongoose.Types.ObjectId;
    montantacte?: number;
    TYPEACTE?: string;
    MontantAuMed?: Number;
    resultatacte?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: mongoose.Types.ObjectId;
    TypeResultat?: number;
    Interpretation?: string;
    ORdonnacementAffichage?: number;

}


const ActeCliniqueSchema: Schema<IActeClinique> = new Schema({
    designationacte: { type: String, required: true, unique: true },
    lettreCle: { type: String, required: true },
    coefficient: { type: Number, required: true },
    prixClinique: { type: Number, required: true },
    prixMutuel: { type: Number },
    prixPreferentiel: { type: Number },
    IDTYPE_ACTE: { type: Schema.Types.ObjectId, ref: "TypeActe" },
    montantacte: { type: Number },
    TYPEACTE: { type: String },
    MontantAuMed: { type: Number },
    resultatacte: { type: String },
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: "FamilleActe" },
    TypeResultat: { type: Number },
    Interpretation: { type: String },
    ORdonnacementAffichage: { type: Number },
}, { timestamps: true });
export const ActeClinique: Model<IActeClinique> = mongoose.models.ActeClinique || mongoose.model<IActeClinique>("ActeClinique", ActeCliniqueSchema);