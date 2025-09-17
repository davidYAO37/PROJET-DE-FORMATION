import mongoose, { Model, Schema } from "mongoose";

export interface IPatientPrescription extends Document {
    IDPRESCRIPTION: number;
    patient: mongoose.Types.ObjectId; // ref Patient
    quantite: number;
    posologie: string;
    datePres: Date;
    heureFacturation?: string;
    prixUnitaire: number;
    prixTotal: number;
    nomMedicament: string;
    partAssurance: number;
    partAssure: number;
    codePrestation: string;
    medicament: mongoose.Types.ObjectId; // ref Medicament
    priseCharge?: number;
    reference?: string;
    exclusionActe?: string;
    statutPrescriptionMedecin?: number;
    actePayeCaisse?: string;
    payeLe?: Date;
    payePar?: string;
    datePaiement?: Date;
    heure?: string;
    facturation?: mongoose.Types.ObjectId; // ref Facturation
    societeAssurance?: mongoose.Types.ObjectId;
    societePatient?: string;
}

const PatientPrescriptionSchema = new Schema<IPatientPrescription>({
    IDPRESCRIPTION: Number,
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    quantite: Number,
    posologie: String,
    datePres: Date,
    heureFacturation: String,
    prixUnitaire: Number,
    prixTotal: Number,
    nomMedicament: String,
    partAssurance: Number,
    partAssure: Number,
    codePrestation: String,
    medicament: { type: Schema.Types.ObjectId, ref: "Medicament" },
    priseCharge: Number,
    reference: String,
    exclusionActe: String,
    statutPrescriptionMedecin: Number,
    actePayeCaisse: String,
    payeLe: Date,
    payePar: String,
    datePaiement: Date,
    heure: String,
    facturation: { type: Schema.Types.ObjectId, ref: "Facturation" },
    societeAssurance: { type: Schema.Types.ObjectId, ref: "SocieteAssurance" },
    societePatient: String
});

export const PatientPrescription: Model<IPatientPrescription> = mongoose.models.PatientPrescription || mongoose.model<IPatientPrescription>("PatientPrescription", PatientPrescriptionSchema);
