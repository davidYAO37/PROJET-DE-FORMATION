import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILignePrestation extends Document {
    _id: Types.ObjectId | string;
    codePrestation: string;
    codeConsultation?: string;
    dateLignePrestation: Date;
    prestation: string;
    qte: number;
    prix: number;
    partAssurance: number;
    tauxAssurance: number;
    idPatient: Types.ObjectId | string;
    idHospitalisation: Types.ObjectId | string;
    partAssure: number;
    prixTotal: number;
    coefficientActe: number;
    reliquatCoefAssurance: number;
    lettreCle: string;
    taxe?: number;
    idTypeActe: Types.ObjectId | string;
    idActe: Types.ObjectId | string;
    idApporteur?: Types.ObjectId | string;
    reliquatPatient?: number;
    totalCoefficient?: number;
    prixClinique?: number;
    numMedecinExecutant?:string;
    montantMedecinExecutant?: number;
    idMedecin?: Types.ObjectId | string;
    acteMedecin?: string;
    resultatActe?: string;
    observationExamen?: string;
    exclusionActe?: string;
    tarifAssurance?: number;
    coefficientAssur?: number;
    coefficientClinique?: Number;
    montantTotalAPayer?: number;
    totalSurplus?: number;
    statutExecutant?: string;
    nomPatient?: string;
    dateSaisieResultat?: Date;
    sexe?: string;
    agePatient?: number;
    situationGeo?: string;
    resultatSaisiePar?: string;
    medecinPrescripteur?: string;
    idFamilleActeBiologie?: Types.ObjectId | string;
    familleActe?: string;
    prixAccepte?: number;
    prixRefuse?: number;
    biologiste?: string;
    validerLe?: Date;
    provenanceExamen?: string;
    externeInterne?: string;
    nIdentificationExamen?: string;
    acteExecuter?: boolean;
    statutPrescriptionMedecin?: number;
    acteFacture?: boolean;
    resultatManuel?: string;
    statutHonoraireMedecin?: number;
    typeResultat?: number;
    actePayeCaisse?: string;
    datePaiementCaisse?: Date;
    heurePaiement?: string;
    payePar?: string;
    compteRenduValidePar?: string;
    compteRenduValideA?: string;
    compteRenduValideLe?: Date;
    medecinExecutant?: string;
    idFacturation?: Types.ObjectId | string;
    SOCIETE_PATIENT?: string;
    ordonnancementAffichage?: number;
}

const LignePrestationSchema = new Schema<ILignePrestation>(
    {
        codePrestation: { type: String, required: true },
        codeConsultation: { type: String },
        dateLignePrestation: { type: Date },
        prestation: { type: String, required: true },
        qte: { type: Number, required: true },
        prix: { type: Number, required: true },
        partAssurance: { type: Number, required: true },
        tauxAssurance: { type: Number, required: true },
        idPatient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
        idHospitalisation: { type: Schema.Types.ObjectId, ref: "ExamenHospit" },
        partAssure: { type: Number, required: true },
        prixTotal: { type: Number, required: true },
        coefficientActe: { type: Number, required: true },
        reliquatCoefAssurance: { type: Number, required: true },
        lettreCle: { type: String, required: true },
        taxe: { type: Number },
        idTypeActe: { type: Schema.Types.ObjectId, ref: "NatureActe" },
        idActe: { type: Schema.Types.ObjectId, ref: "ActeClinique", required: true },
        idApporteur: { type: Schema.Types.ObjectId, ref: "Apporteur" },
        reliquatPatient: { type: Number },
        totalCoefficient: { type: Number },
        prixClinique: { type: Number },
        numMedecinExecutant: { type: String },
        montantMedecinExecutant: { type: Number },
        idMedecin: { type: Schema.Types.ObjectId, ref: "Medecin" },
        acteMedecin: { type: String },
        resultatActe: { type: String },
        observationExamen: { type: String },
        exclusionActe: { type: String },
        tarifAssurance: { type: Number },
        coefficientAssur: { type: Number },
        coefficientClinique: { type: Number },
        montantTotalAPayer: { type: Number },
        totalSurplus: { type: Number },
        statutExecutant: { type: String },
        nomPatient: { type: String },
        dateSaisieResultat: { type: Date },
        sexe: { type: String },
        agePatient: { type: Number },
        situationGeo: { type: String },
        resultatSaisiePar: { type: String },
        medecinPrescripteur: { type: String },
        idFamilleActeBiologie: { type: Schema.Types.ObjectId, ref: "FamilleActeBiologie" },
        familleActe: { type: String },
        prixAccepte: { type: Number },
        prixRefuse: { type: Number },
        biologiste: { type: String },
        validerLe: { type: Date },
        provenanceExamen: { type: String },
        externeInterne: { type: String },
        nIdentificationExamen: { type: String },
        acteExecuter: { type: Boolean, default: false },
        statutPrescriptionMedecin: { type: Number },
        acteFacture: { type: Boolean, default: false },
        resultatManuel: { type: String },
        statutHonoraireMedecin: { type: Number },
        typeResultat: { type: Number },
        actePayeCaisse: { type: String },
        datePaiementCaisse: { type: Date },
        heurePaiement: { type: String },
        payePar: { type: String },
        compteRenduValidePar: { type: String },
        compteRenduValideA: { type: String },
        compteRenduValideLe: { type: Date },
        medecinExecutant: { type: String },
        idFacturation: { type: Schema.Types.ObjectId, ref: "Facturation" },
        SOCIETE_PATIENT: { type: String },
        ordonnancementAffichage: { type: Number },
    },
    { timestamps: true }
);

export const LignePrestation: Model<ILignePrestation> = mongoose.models.LignePrestation || mongoose.model<ILignePrestation>("LignePrestation", LignePrestationSchema);