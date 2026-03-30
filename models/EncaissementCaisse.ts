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
    entrepriseId?: string;
}

const EncaissementCaisseSchema: Schema = new Schema({
    DatePrest: { type: Date },
    Patient: { type: String },
    Assurance: { type: String },
    Designation: { type: String },
    Totalacte: { type: Number },
    Taux: { type: Number },
    PartAssurance: { type: Number },
    Partassure: { type: Number },
    REMISE: { type: Number },
    TotalPaye: { type: Number },
    Restapayer: { type: Number },
    Medecin: { type: String },
    Utilisateur: { type: String },
    DateEncaissement: { type: Date },
    Montantencaisse: { type: Number },
    HeureEncaissement: { type: String },
    Modepaiement: { type: String },
    IDFACTURATION: { type: String },
    IDCONSULTATION: { type: String },
    restapayerBilan: { type: String },
    TotalapayerPatient: { type: Number },
    Assure: { type: String },
    IdPatient: { type: String },
    AnnulationOrdonneLe: { type: Date },
    annulationOrdonnepar: { type: String },
    entrepriseId: { type: String },
});
export const EncaissementCaisse: Model<IEncaissementCaisse> = mongoose.models.EncaissementCaisse || mongoose.model<IEncaissementCaisse>('EncaissementCaisse', EncaissementCaisseSchema);