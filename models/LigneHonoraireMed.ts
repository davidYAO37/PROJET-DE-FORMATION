import mongoose, { Model, Schema, Types } from "mongoose";

export interface ILigneHonoraireMed extends Document {
    legacyId?: number;
    DatePres?: Date;
    IdPres?: number;
    PrestationMed?: string;
    Montantpres?: number;
    Medecin?: Types.ObjectId | null;
    HonoraireMed?: Types.ObjectId | null;
    Totalacte?: number;
    TYPEACTE?: string;
    TAXE?: number;
    Netapayer?: number;
    Patient?: string;
    createdAt?: Date;
    updatedAt?: Date;
}


const LigneHonoraireMedSchema = new Schema<ILigneHonoraireMed>({
    legacyId: { type: Number },
    DatePres: { type: Date },
    IdPres: { type: Number },
    PrestationMed: { type: String, maxlength: 50 },
    Montantpres: { type: Number },
    Medecin: { type: Schema.Types.ObjectId, ref: 'Medecin' },
    HonoraireMed: { type: Schema.Types.ObjectId, ref: 'HonoraireMed' },
    Totalacte: { type: Number },
    TYPEACTE: { type: String, maxlength: 50 },
    TAXE: { type: Number },
    Netapayer: { type: Number },
    Patient: { type: String, maxlength: 60 },
}, { timestamps: true });
export const LigneHonoraireMed: Model<ILigneHonoraireMed> = mongoose.models.LigneHonoraireMedModel || mongoose.model<ILigneHonoraireMed>("LigneHonoraireMed", LigneHonoraireMedSchema);