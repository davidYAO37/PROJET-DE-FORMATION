import mongoose, { Schema, Document, Model } from 'mongoose';
import { TypeCompteRenduOperatoire, StatutCompteRenduOperatoire } from '@/types/compteRenduOperatoire';

export interface ICompteRenduOperatoire extends Document {
    patientId: string;
    patientNom?: string;
    patientPrenoms?: string;
    dateOperation: Date;
    heureDebut?: string;
    heureFin?: string;
    chirurgien: string;
    sexe?: string;
    age?: number;
    assistant?: string;
    anesthesiste?: string;
    indication?: string;
    intervention?: string;
    infirmier?: string;
    typeOperation: TypeCompteRenduOperatoire;
    descriptionOperation: string;
    diagnosticPreOperatoire: string;
    gestesRealises: string;
    complications?: string;
    suitesOperatoires: string;
    traitementPostOperatoire?: string;
    dureeOperation?: number; // en minutes
    statut: StatutCompteRenduOperatoire;
    validatedAt?: Date;
    validatedBy?: string;
    cancelledAt?: Date;
    cancelledBy?: string;
    motifAnnulation?: string;
    numeroDossier: string;
    dateCreation: Date;
    medecinId?: string;
    entrepriseId?: string;
    observations?: string;
}

const CompteRenduOperatoireSchema = new Schema<ICompteRenduOperatoire>({
    patientId: { type: String, required: true },
    patientNom: { type: String },
    patientPrenoms: { type: String },
    dateOperation: { type: Date, required: true },
    heureDebut: { type: String },
    heureFin: { type: String },
    chirurgien: { type: String, required: true },
    sexe: { type: String, required: true },
    age: { type: Number, required: true, min: 0 },
    assistant: { type: String },
    anesthesiste: { type: String },
    indication: { type: String, required: true },
    intervention: { type: String, required: true },
    infirmier: { type: String },
    typeOperation: { type: String, required: true, enum: ['chirurgie_generale', 'orthopedie', 'gynecologie', 'urologie', 'ophtalmologie', 'orl', 'dentaire', 'cardiovasculaire', 'neurologie', 'autre'] },
    descriptionOperation: { type: String, required: true },
    diagnosticPreOperatoire: { type: String, required: true },
    gestesRealises: { type: String, required: true },
    complications: { type: String },
    suitesOperatoires: { type: String, required: true },
    traitementPostOperatoire: { type: String },
    dureeOperation: { type: Number },
    statut: { type: String, required: true, enum: ['brouillon', 'a_valider', 'valide', 'annule', 'planifie', 'en_cours', 'termine'], default: 'brouillon' },
    validatedAt: { type: Date },
    validatedBy: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    motifAnnulation: { type: String },
    numeroDossier: { type: String, required: true },
    dateCreation: { type: Date, default: Date.now },
    medecinId: { type: String },
    entrepriseId: { type: String },
    observations: { type: String },
}, { timestamps: true });

export const CompteRenduOperatoire: Model<ICompteRenduOperatoire> = mongoose.models.CompteRenduOperatoire || mongoose.model<ICompteRenduOperatoire>('CompteRenduOperatoire', CompteRenduOperatoireSchema);