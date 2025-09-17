import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEntreprise extends Document {
    NomSociété?: string;
    AdresseSociété?: string;
    TelSociété?: string;
    VilleSociété?: string;
    EmailSociété?: string;
    LogoE?: Buffer | string;
    FaxSociete?: string;
    PAys?: string;
    Activité?: string;
    NCC?: string;
    SituationGéo?: string;
}

const EntrepriseSchema = new Schema<IEntreprise>({
    NomSociété: { type: String, maxlength: 1000 },
    AdresseSociété: { type: String, maxlength: 50 },
    TelSociété: { type: String, maxlength: 50 },
    VilleSociété: { type: String, maxlength: 50 },
    EmailSociété: { type: String, maxlength: 50 },
    LogoE: { type: Buffer },
    FaxSociete: { type: String, maxlength: 50 },
    PAys: { type: String, maxlength: 50 },
    Activité: { type: String, maxlength: 1000 },
    NCC: { type: String, maxlength: 50 },
    SituationGéo: { type: String, maxlength: 100 },
}, { timestamps: true });

export const Entreprise: Model<IEntreprise> = mongoose.models.Entreprise || mongoose.model<IEntreprise>('Entreprise', EntrepriseSchema);