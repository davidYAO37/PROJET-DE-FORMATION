import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEncaissementCaisse extends Document {
    DatePrest: Date;
    Patient: string;
    assurance: string;
    ACTE: string;
    Totalacte: number;
    Taux: number;
    PartAssurance: number;
    PartPatient: number;
    REMISE: number;
    TotalPaye: number;
    Restapayer: number;
    Medecin: string;
    IDHOSPITALISATION: number;
    Utilisateur: string;
    DateEncaissement: Date;
    Montantencaisse: number;
    HeureEncaissement: string;
    Modepaiement: string;
    BanqueC: string;
    NumCarteVisa: string;
    NCheque: string;
    NumCompteVisa: string;
    IDFACTURATION: number;
    IDCONSULTATION: number;
    restapayerBilan: string;
    TotalapayerPatient: number;
    Assuré: string;
    IDPARTIENT: number;
    AnnulationOrdonneLe: Date;
    annulationOrdonnepar: string;
    Nompatient: string;
}

const EncaissementCaisseSchema: Schema = new Schema({
    DatePrest: { type: Date },
    Patient: { type: String },
    assurance: { type: String },
    ACTE: { type: String },
    Totalacte: { type: Number },
    Taux: { type: Number },
    PartAssurance: { type: Number },
    PartPatient: { type: Number },
    REMISE: { type: Number },
    TotalPaye: { type: Number },
    Restapayer: { type: Number },
    Medecin: { type: String },
    IDHOSPITALISATION: { type: Number },
    Utilisateur: { type: String },
    DateEncaissement: { type: Date },
    Montantencaisse: { type: Number },
    HeureEncaissement: { type: String },
    Modepaiement: { type: String },
    BanqueC: { type: String },
    NumCarteVisa: { type: String },
    NCheque: { type: String },
    NumCompteVisa: { type: String },
    IDFACTURATION: { type: Number },
    IDCONSULTATION: { type: Number },
    restapayerBilan: { type: String },
    TotalapayerPatient: { type: Number },
    Assuré: { type: String },
    IDPARTIENT: { type: Number },
    AnnulationOrdonneLe: { type: Date },
    annulationOrdonnepar: { type: String },
    Nompatient: { type: String },
});
export const EncaissementCaisse: Model<IEncaissementCaisse> = mongoose.models.EncaissementCaisse || mongoose.model<IEncaissementCaisse>('EncaissementCaisse', EncaissementCaisseSchema);