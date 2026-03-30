import mongoose, { Model, Schema, Types } from "mongoose";

export interface IPrescription extends Document {
    _id?: string;
    Designation?: string;
    CodePrestation?: string;
    PatientP?: string;
    IdPatient?: Types.ObjectId;
    DatePres?: Date;
    SaisiPar?: string;
    Rclinique?: string;
    Montanttotal?: number;
    Taux?: number;
    PartAssurance?: number;
    PartAssure?: number;
    Remise?: number;
    MotifRemise?: string;
    Assurance?: string;
    IDASSURANCE?: Types.ObjectId;
    MontantRecu?: number;
    Restapayer?: number;
    IDMEDECIN?: Types.ObjectId;
    NomMed?: string;
    StatutFacture?: boolean;
    Numfacture?: string;
    NumBon?: string;
    Modepaiement?: string;
    Document?: Buffer;
    ExtensionF?: string;
    Souscripteur?: string;
    StatutPaiement?: string;
    Ordonnerlannulation?: number;
    AnnulationOrdonneLe?: Date;
    AnnulationOrdonnePar?: string;
    IDSOCIETEASSURANCE?: string;
    SOCIETE_PATIENT?: string;

    // Champs supplémentaires pour la pharmacie
    StatuPrescriptionMedecin?: number;
    Payéoupas?: boolean;
    Payele?: string;
    Heure?: string;
    TotalapayerPatient?: number;
    IDpriseCharge?: string;
    Caissiere?: string;
    entrepriseId?: string;
}


const PrescriptionSchema = new Schema<IPrescription>(
    {
        Designation: { type: String, maxlength: 100 },
        CodePrestation: { type: String, maxlength: 50 },
        PatientP: { type: String, maxlength: 50 },
        IdPatient: { type: Types.ObjectId, ref: 'Patient', required: false },
        DatePres: { type: Date },
        SaisiPar: { type: String, maxlength: 60 },
        Rclinique: { type: String, maxlength: 250 },
        Montanttotal: { type: Number },
        Taux: { type: Number },
        PartAssurance: { type: Number },
        PartAssure: { type: Number },
        Remise: { type: Number },
        MotifRemise: { type: String },
        Assurance: { type: String },
        IDASSURANCE: { type: Types.ObjectId, ref: 'Assurance', required: false },
        MontantRecu: { type: Number },
        Restapayer: { type: Number },
        IDMEDECIN: { type: Types.ObjectId, ref: 'Medecin', required: false },
        NomMed: { type: String },
        StatutFacture: { type: Boolean },
        Numfacture: { type: String },
        NumBon: { type: String },
        Modepaiement: { type: String },
        Document: { type: Buffer },
        ExtensionF: { type: String },
        Souscripteur: { type: String },
        StatutPaiement: { type: String },
        Ordonnerlannulation: { type: Number },
        AnnulationOrdonneLe: { type: Date },
        AnnulationOrdonnePar: { type: String },
        IDSOCIETEASSURANCE: { type: String },
        SOCIETE_PATIENT: { type: String },

        // Champs supplémentaires pour la pharmacie
        StatuPrescriptionMedecin: { type: Number },
        Payéoupas: { type: Boolean },
        Payele: { type: String },
        Heure: { type: String },
        TotalapayerPatient: { type: Number },
        IDpriseCharge: { type: String },
        Caissiere: { type: String, maxlength: 60 },
        entrepriseId: { type: String },
    },
    { timestamps: true }
);
export const Prescription: Model<IPrescription> = mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);