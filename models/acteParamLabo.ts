import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IActeParamLabo extends Document {
    IDPARAM_LABO?: Types.ObjectId;
    IDACTEP?: Types.ObjectId;
    PlageMaxEnfant?: number;
    PlageMinEnfant?: number;
    PlageMinMaxEnfant?: string;
    PLageMinFemme?: number;
    PlageMaxFemme?: number;
    PlageMinMaxFemme?: string;
    PlageMinHomme?: number;
    PlageMaxHomme?: number;
    PlageMinMaxHomme?: string;
    PlageMinMaxNé?: string;
    PlageRefMinNe?: number;
    PlageRefMaxNé?: number;
    NUM_PARAM?: number;
    Param_designation?: string;
    ParamAbrege?: string;
    UnitéParam?: string;
    ValeurNormale?: string;
    ValeurMaxNormale?: number;
    ValeurMinNormale?: number;
    TypeTexte?: boolean;
}

const ActeParamLaboSchema = new Schema<IActeParamLabo>({
    IDPARAM_LABO: { type: Schema.Types.ObjectId, ref: 'ParamLabo' },
    IDACTEP: { type: Schema.Types.ObjectId, ref: 'Acte' },
    PlageMaxEnfant: { type: Number },
    PlageMinEnfant: { type: Number },
    PlageMinMaxEnfant: { type: String, maxlength: 50 },
    PLageMinFemme: { type: Number },
    PlageMaxFemme: { type: Number },
    PlageMinMaxFemme: { type: String, maxlength: 50 },
    PlageMinHomme: { type: Number },
    PlageMaxHomme: { type: Number },
    PlageMinMaxHomme: { type: String, maxlength: 50 },
    PlageMinMaxNé: { type: String, maxlength: 50 },
    PlageRefMinNe: { type: Number },
    PlageRefMaxNé: { type: Number },
    NUM_PARAM: { type: Number },
    Param_designation: { type: String, maxlength: 500 },
    ParamAbrege: { type: String, maxlength: 50 },
    UnitéParam: { type: String, maxlength: 10 },
    ValeurNormale: { type: String, maxlength: 500 },
    ValeurMaxNormale: { type: Number },
    ValeurMinNormale: { type: Number },
    TypeTexte: { type: Boolean, default: false },
}, { timestamps: true });

export const ActeParamLabo: Model<IActeParamLabo> = mongoose.models.ActeParamLabo || mongoose.model<IActeParamLabo>('ActeParamLabo', ActeParamLaboSchema);