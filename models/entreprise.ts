import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEntreprise extends Document {
    NomSociete?: string;
    EnteteSociete?: string;   
    LogoE?: string;
    PiedPageSociete?: string;   
    NCC?: string;
    
}

const EntrepriseSchema = new Schema<IEntreprise>({
    NomSociete: { type: String, maxlength: 1000 },
    EnteteSociete: { type: String, maxlength: 50 },   
    LogoE: { type: String },
    PiedPageSociete: { type: String, maxlength: 50 },   
    NCC: { type: String, maxlength: 50 },
   
}, { timestamps: true });

export const Entreprise: Model<IEntreprise> = mongoose.models.Entreprise || mongoose.model<IEntreprise>('Entreprise', EntrepriseSchema);