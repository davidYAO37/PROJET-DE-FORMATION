import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChambre extends Document {
    numero: string;
    type: string;
    service: string;
    tarifJournalier: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    nombreLits: number;
    etat: 'libre' | 'occupee' | 'reservee' | 'maintenance' | 'fermee';
    observation?: string;
}

const ChambreSchema = new Schema<IChambre>({
    numero: { type: String, required: true, unique: true, index: true },
    type: { type: String, default: 'standard' },
    service: { type: String, default: 'Hospitalisation' },
    tarifJournalier: { type: Number, default: 0 },
    prixClinique: { type: Number, default: 0 },
    prixMutuel: { type: Number, default: 0 },
    prixPreferentiel: { type: Number, default: 0 },
    nombreLits: { type: Number, default: 1 },
    etat: { type: String, enum: ['libre', 'occupee', 'reservee', 'maintenance', 'fermee'], default: 'libre' },
    observation: { type: String }
}, { timestamps: true });

export const Chambre: Model<IChambre> = mongoose.models.Chambre || mongoose.model<IChambre>('Chambre', ChambreSchema);
