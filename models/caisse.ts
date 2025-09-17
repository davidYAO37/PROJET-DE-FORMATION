import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface ICaisse extends Document {
    typeC?: string;
    Operation?: string;
    MOtif?: string;
    MOntantC?: number;
    dAteC?: Date;
    HeureC?: string;
    NomPrenoms?: string;
    Contact?: string;
    serviceC?: string;
    solde?: number;
    AjouterParC?: string;
    FonctionC?: string;
    MODifieParC?: string;
    MODifLe?: Date;
    IDOpération?: number;
    IDHonoraireMed?: Types.ObjectId;
    IDMEDECIN?: Types.ObjectId;
}

const CaisseSchema = new Schema<ICaisse>({
    typeC: { type: String, maxlength: 50 },
    Operation: { type: String, maxlength: 200 },
    MOtif: { type: String, maxlength: 500 },
    MOntantC: { type: Number },
    dAteC: { type: Date },
    HeureC: { type: String, maxlength: 10 },
    NomPrenoms: { type: String, maxlength: 75 },
    Contact: { type: String, maxlength: 50 },
    serviceC: { type: String, maxlength: 100 },
    solde: { type: Number },
    AjouterParC: { type: String, maxlength: 60 },
    FonctionC: { type: String, maxlength: 50 },
    MODifieParC: { type: String, maxlength: 60 },
    MODifLe: { type: Date },
    IDOpération: { type: Number },
    IDHonoraireMed: { type: Schema.Types.ObjectId, ref: 'HonoraireMed' },
    IDMEDECIN: { type: Schema.Types.ObjectId, ref: 'Medecin' },
}, { timestamps: true });

export const caisse: Model<ICaisse> = mongoose.models.Caisse || mongoose.model<ICaisse>('Caisse', CaisseSchema);