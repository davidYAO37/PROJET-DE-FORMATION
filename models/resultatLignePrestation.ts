import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IResultatLignePrestation extends Document {
    ParamAbrege?: string;
    Param_designation?: string;
    PlageMin?: number;
    PlageMax?: number;
    ValeurNormale?: string;
    ChampResultat?: string;
    IDPARAM_LABO?: Types.ObjectId;
    IDLIGNE_PRESTATION?: Types.ObjectId;
    IDACTEP?: Types.ObjectId;
    idHospitalisation?: Types.ObjectId;
    IDFAMILLE_ACTE_BIOLOGIE?: Types.ObjectId;
    ACTE?: string;
    Interpretation?: string;
    ProvenanceExamen?: string;
    Externe_Interne?: string;
    NIdentificationExamen?: string;
    TypeTexte?: boolean;
    AlignerActe?: number;
    unite?: string;
    ORdonnacementAffichage?: number;
}

const ResultatLignePrestationSchema = new Schema<IResultatLignePrestation>({
    ParamAbrege: { type: String, maxlength: 50 },
    Param_designation: { type: String, maxlength: 500 },
    PlageMin: { type: Number },
    PlageMax: { type: Number },
    ValeurNormale: { type: String, maxlength: 500 },
    ChampResultat: { type: String, maxlength: 1000 },
    IDPARAM_LABO: { type: Schema.Types.ObjectId, ref: 'ParamLabo' },
    IDLIGNE_PRESTATION: { type: Schema.Types.ObjectId, ref: 'LignePrestation' },
    IDACTEP: { type: Schema.Types.ObjectId, ref: 'Acte' },
    idHospitalisation: { type: Schema.Types.ObjectId, ref: 'ExamenHospitalisation' },
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: 'FamilleActe' },
    ACTE: { type: String, maxlength: 100 },
    Interpretation: { type: String, maxlength: 1000 },
    ProvenanceExamen: { type: String, maxlength: 150 },
    Externe_Interne: { type: String, maxlength: 15 },
    NIdentificationExamen: { type: String, maxlength: 50 },
    TypeTexte: { type: Boolean, default: false },
    AlignerActe: { type: Number },
    unite: { type: String, maxlength: 50 },
    ORdonnacementAffichage: { type: Number },
}, { timestamps: true });

export const ResultatLignePrestation: Model<IResultatLignePrestation> = mongoose.models.ResultatLignePrestation || mongoose.model<IResultatLignePrestation>('ResultatLignePrestation', ResultatLignePrestationSchema);