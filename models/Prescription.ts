import mongoose, { Model, Schema, Types } from "mongoose";

export interface IPatientPrescription extends Document {
    legacyId?: number;
    Prescription?: Types.ObjectId;
    PatientRef?: Types.ObjectId;
    QtéP?: number;
    Posologie?: string;
    DatePres?: Date;
    Heure_Facturation?: string;
    prixunitaire?: number;
    PrixTotal?: number;
    nomMedicament?: string;
    PartAssurance?: number;
    Partassuré?: number;
    Code_Prestation?: string;
    Medicament?: Types.ObjectId;
    IDpriseCharge?: number;
    Reference?: string;
    ExclusionActae?: string;
    StatuPrescriptionMedecin?: number;
    ACTEPAYECAISSE?: string;
    Payele?: Date;
    PayéPar?: string;
    DatePaiement?: Date;
    Heure?: string;
    Facturation?: Types.ObjectId;
    SocieteAssurance?: Types.ObjectId;
    SOCIETE_PATIENT?: string;
}


const PatientPrescriptionSchema = new Schema<IPatientPrescription>(
    {
        legacyId: { type: Number },
        Prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
        PatientRef: { type: Schema.Types.ObjectId, ref: 'Patient' },
        QtéP: { type: Number },
        Posologie: { type: String, maxlength: 50 },
        DatePres: { type: Date },
        Heure_Facturation: { type: String, maxlength: 10 },
        prixunitaire: { type: Number },
        PrixTotal: { type: Number },
        nomMedicament: { type: String, maxlength: 50 },
        PartAssurance: { type: Number },
        Partassuré: { type: Number },
        Code_Prestation: { type: String, maxlength: 50 },
        Medicament: { type: Schema.Types.ObjectId, ref: 'Pharmacie' },
        IDpriseCharge: { type: Number },
        Reference: { type: String, maxlength: 30 },
        ExclusionActae: { type: String, maxlength: 50 },
        StatuPrescriptionMedecin: { type: Number },
        ACTEPAYECAISSE: { type: String, maxlength: 10 },
        Payele: { type: Date },
        PayéPar: { type: String, maxlength: 50 },
        DatePaiement: { type: Date },
        Heure: { type: String, maxlength: 10 },
        Facturation: { type: Schema.Types.ObjectId, ref: 'Facturation' },
        SocieteAssurance: { type: Schema.Types.ObjectId, ref: 'SocieteAssurance' },
        SOCIETE_PATIENT: { type: String, maxlength: 60 },
    },
    { timestamps: true }
);
export const PatientPrescription: Model<IPatientPrescription> = mongoose.models.PatientPrescription || mongoose.model<IPatientPrescription>('PatientPrescription', PatientPrescriptionSchema);