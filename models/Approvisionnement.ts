import mongoose, { Model, Schema } from "mongoose";

export interface IApprovisionnement extends Document {
    _id?: string;
    DateAppro?: string | Date;
    PrixHT?: number;
    tVAApro?: number;
    Transport?: number;
    MontantTTC?: number;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: string | Date;
}

const ApprovisionnementSchema = new Schema<IApprovisionnement>({
    DateAppro: { type: Date },
    PrixHT: { type: Number },
    tVAApro: { type: Number },
    Transport: { type: Number },
    MontantTTC: { type: Number },
    Observations: { type: String, maxlength: 120 },
    SaisiPar: { type: String, maxlength: 40 },
    SaisiLe: { type: Date },
}, { timestamps: true });
export const Approvisionnement: Model<IApprovisionnement> = mongoose.models.Approvisionnement || mongoose.model<IApprovisionnement>("Approvisionnement", ApprovisionnementSchema);