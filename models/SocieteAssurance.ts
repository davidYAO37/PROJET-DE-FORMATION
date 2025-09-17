import mongoose, { Model, Schema, Types } from "mongoose";
import { IAssurance } from "./assurance";

export interface ISocieteAssurance extends Document {
    legacyId?: number;
    Assurance: Types.ObjectId | IAssurance;
    societe?: string;

}


const SocieteAssuranceSchema = new Schema<ISocieteAssurance>(
    {
        legacyId: { type: Number },
        Assurance: { type: Schema.Types.ObjectId, ref: 'Assurance', required: true },
        societe: { type: String, maxlength: 60 },

    },
    { timestamps: true }
);
export const SocieteAssurance: Model<ISocieteAssurance> = mongoose.models.SocieteAssurance || mongoose.model<ISocieteAssurance>('SocieteAssurance', SocieteAssuranceSchema);