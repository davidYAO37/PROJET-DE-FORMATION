import mongoose, { Model, Schema } from "mongoose";

export interface IApprovisionnement extends Document {
    legacyId?: number;
    DateAppro?: Date;
    PrixHT?: number;
    tVAApro?: number;
    Transport?: number;
    MontantTTC?: number;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}


const ApprovisionnementSchema = new Schema<IApprovisionnement>({
    legacyId: { type: Number },
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