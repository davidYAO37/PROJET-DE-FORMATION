import mongoose, { Model, Schema, Types } from "mongoose";

export interface IPrescription extends Document {
    _id?: string;
    Designation?: string;
    CodePrestation?: string;
    PatientP?: string;
    DatePres?: Date;
    SaisiPar?: string;
    Rclinique?: string;
    Montanttotal?: number;
    Taux?: number;
    PartAssurance?: number;
    PartAssure?: number;
    Remise?: number;
    MotifRemise?: string;
    Assurance?:string;
    IDASSURANCE?:Types.ObjectId;
    MontantRecu?:number;
    Restapayer?:number;
    idMedecin?:Types.ObjectId;
    NomMed?:string;
    StatutFacture?:boolean;
    Numfacture?:string;
    NumBon?:string;
    Modepaiement?:string;
    Document?:Buffer;
    ExtensionF?:string;
    Souscripteur?:string;
    StatutPaiement?:string;
    Ordonnerlannulation?:number;
    AnnulationOrdonneLe?:Date;
    AnnulationOrdonnePar?:string;
    IDSOCIETEASSURANCE?: Types.ObjectId;
    SOCIETE_PATIENT?: string;

    
}


const PatientPrescriptionSchema = new Schema<IPrescription>(
    {
    Designation: {Type: String, maxlength: 100},
    CodePrestation: {Type: String, maxlength: 50},
    PatientP: {Type: String, maxlength: 50},
    DatePres: {Type: Date},
    SaisiPar: {Type: String, maxlength: 60},
    Rclinique: {Type: String, maxlength: 250},
    Montanttotal: {type: Number},
    Taux: {type: Number},
    PartAssurance: {type: Number},
    PartAssure: {type: Number},
    Remise: {type: Number},
    MotifRemise: {type: String},
    Assurance:{type: String},
    IDASSURANCE:{type: Types.ObjectId, ref: 'Assurance'},
    MontantRecu:{type: Number},
    Restapayer:{type: Number},
    idMedecin:{type: Types.ObjectId, ref: 'Medecin'},
    NomMed:{type: String},
    StatutFacture: { type: Boolean },
    Numfacture:{type: String},
    NumBon:{type: String},
    Modepaiement:{type: String},
    Document:{type: Buffer},
    ExtensionF:{type: String},
    Souscripteur:{type: String},
    StatutPaiement:{type: String},
    Ordonnerlannulation:{type: Number},
    AnnulationOrdonneLe:{type: Date},
    AnnulationOrdonnePar:{type: String},
    IDSOCIETEASSURANCE:{type: Types.ObjectId, ref: 'SocieteAssurance'},
    SOCIETE_PATIENT:{type: String},
    },
    { timestamps: true }
);
export const Prescription: Model<IPrescription> = mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PatientPrescriptionSchema);