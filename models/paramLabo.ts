import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParamLabo extends Document {
    NUM_PARAM?: number;
    ParamAbrege?: string;
    Param_designation?: string;
    PlageRefMinNe?: number;
    PlageRefMaxNé?: number;
    UnitéParam?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: Schema.Types.ObjectId;
    PlageMinMaxNé?: string;
    PlageMinEnfant?: number;
    PlageMaxEnfant?: number;
    PlageMinMaxEnfant?: string;
    PLageMinFemme?: number;
    PlageMaxFemme?: number;
    PlageMinMaxFemme?: string;
    PlageMinHomme?: number;
    PlageMaxHomme?: number;
    PlageMinMaxHomme?: string;
    ValeurNormale?: string;
    ValeurMinNormale?: number;
    ValeurMaxNormale?: number;
    TypeTexte?: boolean;
}

const ParamLaboSchema = new Schema<IParamLabo>({
    NUM_PARAM: { type: Number },
    ParamAbrege: { type: String, maxlength: 50 },
    Param_designation: { type: String, maxlength: 500 },
    PlageRefMinNe: { type: Number },
    PlageRefMaxNé: { type: Number },
    UnitéParam: { type: String, maxlength: 10 },
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: 'FamilleActe' },
    PlageMinMaxNé: { type: String, maxlength: 50 },
    PlageMinEnfant: { type: Number },
    PlageMaxEnfant: { type: Number },
    PlageMinMaxEnfant: { type: String, maxlength: 50 },
    PLageMinFemme: { type: Number },
    PlageMaxFemme: { type: Number },
    PlageMinMaxFemme: { type: String, maxlength: 50 },
    PlageMinHomme: { type: Number },
    PlageMaxHomme: { type: Number },
    PlageMinMaxHomme: { type: String, maxlength: 50 },
    ValeurNormale: { type: String, maxlength: 500 },
    ValeurMinNormale: { type: Number },
    ValeurMaxNormale: { type: Number },
    TypeTexte: { type: Boolean, default: false },
}, { timestamps: true });

export const ParamLabo: Model<IParamLabo> = mongoose.models.ParamLabo || mongoose.model<IParamLabo>('ParamLabo', ParamLaboSchema);