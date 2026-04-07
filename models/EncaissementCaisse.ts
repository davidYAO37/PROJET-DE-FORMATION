import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEncaissementCaisse extends Document {
    DatePrest?: Date;
    Patient?: string;
    Assurance?: string;
    Designation?: string;
    Totalacte?: number;
    Taux?: number;
    PartAssurance?: number;
    Partassure?: number;
    REMISE?: number;
    TotalPaye?: number;
    Restapayer?: number;
    Medecin?: string;
    Utilisateur?: string;
    DateEncaissement?: Date;
    Montantencaisse?: number;
    HeureEncaissement?: string;
    Modepaiement?: string;
    IDFACTURATION?: string;
    IDCONSULTATION?: string;
    restapayerBilan?: string;
    TotalapayerPatient?: number;
    Assure?: string;
    IdPatient?: string;
    AnnulationOrdonneLe?: Date;
    annulationOrdonnepar?: string;
    Ordonnerlannulation?: boolean;
    StatutOrdonner?: number;
    entrepriseId?: string;
}

const EncaissementCaisseSchema: Schema = new Schema({
    DatePrest: { type: Date },
    Patient: { type: String, maxlength: 60 },
    Assurance: { type: String },
    Designation: { type: String, maxlength: 100 },
    Totalacte: { type: Number },
    Taux: { type: Number },
    PartAssurance: { type: Number },
    Partassure: { type: Number },
    REMISE: { type: Number },
    TotalPaye: { type: Number },
    Restapayer: { type: Number },
    Medecin: { type: String, maxlength: 60 },
    Utilisateur: { type: String, maxlength: 50 },
    DateEncaissement: { type: Date },
    Montantencaisse: { type: Number },
    HeureEncaissement: { type: String, maxlength: 50 },
    Modepaiement: { type: String, maxlength: 50 },
    IDFACTURATION: { type: String },
    IDCONSULTATION: { type: String },
    restapayerBilan: { type: String, maxlength: 50 },
    TotalapayerPatient: { type: Number },
    Assure: { type: String },
    IdPatient: { type: String },
    AnnulationOrdonneLe: { type: Date },
    annulationOrdonnepar: { type: String, maxlength: 50 },
    Ordonnerlannulation: { type: Boolean, default: false },
    StatutOrdonner: { type: Number, default: 0 },
    entrepriseId: { type: String },
});
export const EncaissementCaisse: Model<IEncaissementCaisse> = mongoose.models.EncaissementCaisse || mongoose.model<IEncaissementCaisse>('EncaissementCaisse', EncaissementCaisseSchema);