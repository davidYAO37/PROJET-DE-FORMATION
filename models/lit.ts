import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILit extends Document {
    numero: string;
    chambreId: mongoose.Types.ObjectId | string;
    service: string;
    tarifJournalier: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    etat: 'libre' | 'occupe' | 'reserve' | 'nettoyage' | 'maintenance';
    patientId?: mongoose.Types.ObjectId | string;
    dateOccupation?: Date;
    dateLiberation?: Date;
    observation?: string;
}

const LitSchema = new Schema<ILit>({
    numero: { type: String, required: true, index: true },
    chambreId: { type: Schema.Types.ObjectId, ref: 'Chambre', required: true, index: true },
    service: { type: String, default: 'Hospitalisation' },
    tarifJournalier: { type: Number, default: 0 },
    prixClinique: { type: Number, default: 0 },
    prixMutuel: { type: Number, default: 0 },
    prixPreferentiel: { type: Number, default: 0 },
    etat: { type: String, enum: ['libre', 'occupe', 'reserve', 'nettoyage', 'maintenance'], default: 'libre' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', index: true },
    dateOccupation: { type: Date },
    dateLiberation: { type: Date },
    observation: { type: String }
}, { timestamps: true });

export const Lit: Model<ILit> = mongoose.models.Lit || mongoose.model<ILit>('Lit', LitSchema);
