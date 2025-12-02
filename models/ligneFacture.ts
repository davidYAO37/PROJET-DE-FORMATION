import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface ILigneFacture extends Document {
    DateFacture?: Date;
    TotalHT?: number;
    FactureAssur?: Types.ObjectId;
    ACTEF?: string;
    Partassure?: number;
    PartAssurance?: number;
    Totalacte?: number;
    SaisiLe?: Date;
    SaisiPar?: string;
    TYPEACTE?: string;
    Matricule?: string;
    NumBon?: string;
    idHospitalisation?: Types.ObjectId;
    IDCONSULTATION?: Types.ObjectId;
    IDPRESCRIPTION?: Types.ObjectId;
    IDANNALYSE?: Types.ObjectId;
    IDMAGERIE?: Types.ObjectId;
    IDCHIRURGIE?: Types.ObjectId;
    Beneficiaire?: string;
    SOCIETE_PATIENT?: string;
}

const LigneFactureSchema = new Schema<ILigneFacture>({
    DateFacture: { type: Date },
    TotalHT: { type: Number },
    FactureAssur: { type: Schema.Types.ObjectId, ref: 'FactureAssur' },
    ACTEF: { type: String, maxlength: 100 },
    Partassure: { type: Number },
    PartAssurance: { type: Number },
    Totalacte: { type: Number },
    SaisiLe: { type: Date },
    SaisiPar: { type: String, maxlength: 40 },
    TYPEACTE: { type: String, maxlength: 50 },
    Matricule: { type: String, maxlength: 50 },
    NumBon: { type: String, maxlength: 50 },
    idHospitalisation: { type: Schema.Types.ObjectId, ref: 'ExamenHospitalisation' },
    IDCONSULTATION: { type: Schema.Types.ObjectId, ref: 'Consultation' },
    IDPRESCRIPTION: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    IDANNALYSE: { type: Schema.Types.ObjectId, ref: 'Analyse' },
    IDMAGERIE: { type: Schema.Types.ObjectId, ref: 'Imagerie' },
    IDCHIRURGIE: { type: Schema.Types.ObjectId, ref: 'Chirurgie' },
    Beneficiaire: { type: String, maxlength: 60 },
    SOCIETE_PATIENT: { type: String, maxlength: 60 },
}, { timestamps: true });

export const LigneFacture: Model<ILigneFacture> = mongoose.models.LigneFacture || mongoose.model<ILigneFacture>('LigneFacture', LigneFactureSchema);