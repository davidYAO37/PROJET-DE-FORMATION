import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEntreprise extends Document {
    NomSociete?: string;
    nomSociete?: string;
    EnteteSociete?: string;
    enteteSociete?: string;
    LogoE?: string;
    logo?: string;
    PiedPageSociete?: string;
    piedPageSociete?: string;
    NCC?: string;
    ncc?: string;
    adresse?: string;
    contact?: string;
    email?: string;
    mongoUri?: string;
    dbName?: string;
    statut?: "active" | "suspendue" | "resiliee";
    dateExpiration?: Date;
    licenceKey?: string;
    isActive?: boolean;
}

const EntrepriseSchema = new Schema<IEntreprise>({
    NomSociete: { type: String, alias: "nomSociete", maxlength: 1000 },
    EnteteSociete: { type: String, alias: "enteteSociete", maxlength: 10000 },
    LogoE: { type: String, alias: "logo" },
    PiedPageSociete: { type: String, alias: "piedPageSociete", maxlength: 10000 },
    NCC: { type: String, alias: "ncc", maxlength: 50 },
    adresse: { type: String, maxlength: 500 },
    contact: { type: String, maxlength: 100 },
    email: { type: String, maxlength: 200, lowercase: true },
    mongoUri: { type: String, maxlength: 1000 },
    dbName: { type: String, maxlength: 200, unique: true, sparse: true },
    statut: { type: String, enum: ["active", "suspendue", "resiliee"], default: "active" },
    dateExpiration: { type: Date },
    licenceKey: { type: String, maxlength: 500 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: "entreprises" });

export const Entreprise: Model<IEntreprise> = mongoose.models.Entreprise || mongoose.model<IEntreprise>('Entreprise', EntrepriseSchema);