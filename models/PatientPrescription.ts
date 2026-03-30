import mongoose, { Model, Schema } from "mongoose";

export interface IPatientPrescription extends Document {
    _id?: string;
    IDPRESCRIPTION: string;
    PatientP: string
    IdPatient: string;
    QteP: number;
    posologie: string;
    DatePres: Date;
    heureFacturation?: string;
    prixUnitaire: number;
    prixTotal: number;
    nomMedicament: string;
    partAssurance: number;
    partAssure: number;
    CodePrestation: string;
    medicament: mongoose.Types.ObjectId; // ref Medicament
    priseCharge?: number;
    reference?: string;
    exclusionActe?: string;
    StatutPrescriptionMedecin?: number;
    actePayeCaisse?: string;
    payeLe?: Date;
    payePar?: string;
    datePaiement?: Date;
    heure?: string;
    facturation?: mongoose.Types.ObjectId; // ref Facturation
    IDSOCIETEASSURANCE?: string;
    SOCIETE_PATIENT?: string;
    Assurance?: string;
    IDASSURANCE?: string;
    entrepriseId?: string;
}

const PatientPrescriptionSchema = new Schema<IPatientPrescription>({
    IDPRESCRIPTION: { type: String },
    PatientP: String,
    IdPatient: String,
    QteP: Number,
    posologie: String,
    DatePres: Date,
    heureFacturation: String,
    prixUnitaire: Number,
    prixTotal: Number,
    nomMedicament: String,
    partAssurance: Number,
    partAssure: Number,
    CodePrestation: String,
    medicament: { type: Schema.Types.ObjectId, ref: "Medicament" },
    priseCharge: Number,
    reference: String,
    exclusionActe: String,
    StatutPrescriptionMedecin: Number,
    actePayeCaisse: String,
    payeLe: Date,
    payePar: String,
    datePaiement: Date,
    heure: String,
    facturation: { type: Schema.Types.ObjectId, ref: "Facturation" },
    IDSOCIETEASSURANCE: String,
    SOCIETE_PATIENT: String,
    Assurance: String,
    IDASSURANCE: String,
    entrepriseId: String,
});

export const PatientPrescription: Model<IPatientPrescription> = mongoose.models.PatientPrescription || mongoose.model<IPatientPrescription>("PatientPrescription", PatientPrescriptionSchema);
