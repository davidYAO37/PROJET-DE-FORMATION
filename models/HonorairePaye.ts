import mongoose, { Model, Schema, Types } from "mongoose";

export interface IHonorairePaye extends Document {
    legacyId?: number;
    Date?: Date;
    Heure?: string;
    MontantJour?: number;
    MontantPayé?: number;
    Restapayer?: number;
    PayéPar?: string;
    Recupar?: string;
    Medecin?: Types.ObjectId | null;
    HonoraireMed?: Types.ObjectId | null;
    BanqueC?: string;
    NCheque?: string;
    Modepaiement?: string;
    createdAt?: Date;
    updatedAt?: Date;
}


const HonorairePayeSchema = new Schema<IHonorairePaye>({
    legacyId: { type: Number },
    Date: { type: Date },
    Heure: { type: String, maxlength: 10 },
    MontantJour: { type: Number },
    MontantPayé: { type: Number },
    Restapayer: { type: Number },
    PayéPar: { type: String, maxlength: 50 },
    Recupar: { type: String, maxlength: 50 },
    Medecin: { type: Schema.Types.ObjectId, ref: 'Medecin' },
    HonoraireMed: { type: Schema.Types.ObjectId, ref: 'HonoraireMed' },
    BanqueC: { type: String, maxlength: 50 },
    NCheque: { type: String, maxlength: 50 },
    Modepaiement: { type: String, maxlength: 50 },
}, { timestamps: true });
export const HonorairePaye: Model<IHonorairePaye> = mongoose.models.HonorairePaye || mongoose.model<IHonorairePaye>("HonorairePaye", HonorairePayeSchema);