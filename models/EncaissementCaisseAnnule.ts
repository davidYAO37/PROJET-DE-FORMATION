import mongoose, { Model, Schema, Types } from "mongoose";

export interface IEncaissementCaisseAnnule extends Document {
    legacyId?: number;
    DatePrest?: Date;
    Patient?: string;
    ACTE?: string;
    Taux?: number;
    Restapayer?: number;
    Medecin?: string;
    Utilisateur?: string;
    DateEncaissement?: Date;
    Montantencaisse?: number;
    HeureEncaissement?: string;
    Modepaiement?: string;
    NCheque?: string;
    NumCompteVisa?: string;
    Facturation?: Types.ObjectId;
    Consultation?: Types.ObjectId;
    restapayerBilan?: string;
    TotalapayerPatient?: number;
    PatientRef?: Types.ObjectId;
    AnnulationOrdonneLe?: Date;
    annulationOrdonnepar?: string;
    Annulerle?: Date;
    AnnulerPar?: string;
    motifAnnulation?: string;
    DetailActePharm?: Types.ObjectId;
    Hospitalisation?: Types.ObjectId;
    PartientExamActe?: string;
    QteM?: number;
    LibeleM?: string;
    PrixUni?: number;
    Posologie?: string;
    PrixTotal?: number;
}


const EncaissementCaisseAnnuleSchema = new Schema<IEncaissementCaisseAnnule>(
    {
        legacyId: { type: Number },
        DatePrest: { type: Date },
        Patient: { type: String, maxlength: 60 },
        ACTE: { type: String, maxlength: 100 },
        Taux: { type: Number },
        Restapayer: { type: Number },
        Medecin: { type: String, maxlength: 60 },
        Utilisateur: { type: String, maxlength: 50 },
        DateEncaissement: { type: Date },
        Montantencaisse: { type: Number },
        HeureEncaissement: { type: String, maxlength: 10 },
        Modepaiement: { type: String, maxlength: 50 },
        NCheque: { type: String, maxlength: 50 },
        NumCompteVisa: { type: String, maxlength: 50 },
        Facturation: { type: Schema.Types.ObjectId, ref: 'Facturation' },
        Consultation: { type: Schema.Types.ObjectId, ref: 'Consultation' },
        restapayerBilan: { type: String, maxlength: 50 },
        TotalapayerPatient: { type: Number },
        PatientRef: { type: Schema.Types.ObjectId, ref: 'Patient' },
        AnnulationOrdonneLe: { type: Date },
        annulationOrdonnepar: { type: String, maxlength: 50 },
        Annulerle: { type: Date },
        AnnulerPar: { type: String, maxlength: 50 },
        motifAnnulation: { type: String, maxlength: 100 },
        DetailActePharm: { type: Schema.Types.ObjectId, ref: 'DetailActePharm' },
        Hospitalisation: { type: Schema.Types.ObjectId, ref: 'Hospitalisation' },
        PartientExamActe: { type: String },
        QteM: { type: Number },
        LibeleM: { type: String, maxlength: 100 },
        PrixUni: { type: Number },
        Posologie: { type: String, maxlength: 100 },
        PrixTotal: { type: Number },
    },
    { timestamps: true }
);

export const EncaissementCaisseAnnule: Model<IEncaissementCaisseAnnule> = mongoose.models.EncaissementCaisseAnnule || mongoose.model<IEncaissementCaisseAnnule>('EncaissementCaisseAnnule', EncaissementCaisseAnnuleSchema);