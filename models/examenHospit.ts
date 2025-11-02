
import mongoose, { Schema, model, Document, Types, Model } from 'mongoose';

export interface IExamenHospitalisation extends Document {
    _id: string
    Code_Prestation?: string;
    NomMed?: string;
    PatientP?: string;
    DatePres?: Date;
    SaisiPar?: string;
    Rclinique?: string;
    Montanttotal?: number;
    TotalPaye?: number;
    TotaleTaxe?: number;
    MontantRecu?: number;
    reduction?: number;
    tauxreduction?: number;
    MotifRemise?: string;
    Restapayer?: number;
    DateEncaissement?: Date;
    TotalapayerPatient?: number;
    SocieteP?: string;
    PartAssuranceP?: number;
    Partassure?: number;
    Assurance?: string;
    Taux?: string;
    IDASSURANCE?: Types.ObjectId;
    IDTYPE_ACTE?: String;
    FacturePar?: string;
    idPatient?: Types.ObjectId;
    CompteClient?: boolean;
    ModifierPar?: string;
    HeureModif?: string;
    IDAPPORTEUR?: number;
    Entrele?: Date;
    SortieLe?: Date;
    Chambre?: string;
    DureeE?: number;
    Numcarte?: string;
    Designationtypeacte?: string;
    StatutFacture?: boolean;
    Numfacture?: string;
    NumBon?: string;
    MontantMedecin?: number;
    PartApporteur?: number;
    idMedecin?: Types.ObjectId;
    Statumed?: string;
    BanqueC?: string;
    NumChèque?: string;
    Modepaiement?: string;
    TotalReliquatPatient?: number;
    CautionPatient?: number;
    Assure?: string;
    MontantMedecinExécutant?: number;
    NummedecinExécutant?: string;
    MedecinExécutant?: string;
    Payeoupas?: boolean;
    resultatacte?: string;
    StatutApporteur?: string;
    Statutexécutant?: string;
    ObservationC?: string;
    Receptionnerpar?: string;
    Datetransferbiologiste?: Date;
    Transferepar?: string;
    DATERECEPTIONNER?: Date;
    Heurereception?: string;
    Heure_service?: string;
    dateretour?: Date;
    Document?: Buffer;
    ExtensionF?: string;
    Souscripteur?: string;
    Heure_Facturation?: string;
    CONCLUSIONGENE?: string;
    NumCarteVisa?: string;
    NumCompteVisa?: string;
    DateValidation?: Date;
    IDSOCIETEPARTENAIRE?: Types.ObjectId;
    ProvenanceExamen?: string;
    NIdentificationExamen?: string;
    Biologiste?: string;
    CachetBiologiste?: Buffer;
    CachetMedecin?: Buffer;
    Externe_Interne?: string;
    factureannule?: boolean;
    StatutLaboratoire?: number;
    ObservationHospitalisation?: string;
    IDCHAMBRE?: Types.ObjectId;
    IDSOCIETEASSUANCE?: Types.ObjectId;
    SOCIETE_PATIENT?: string;
    statutPrescriptionMedecin?:number;
}

const ExamenHospitalisationSchema = new Schema<IExamenHospitalisation>(
    {
        Code_Prestation: { type: String, maxlength: 50 },
        NomMed: { type: String, maxlength: 50 },
        PatientP: { type: String, maxlength: 50 },
        DatePres: { type: Date },
        SaisiPar: { type: String, maxlength: 60 },
        Rclinique: { type: String, maxlength: 250 },
        Montanttotal: { type: Number },
        TotalPaye: { type: Number },
        TotaleTaxe: { type: Number },
        MontantRecu: { type: Number },
        reduction: { type: Number },
        tauxreduction: { type: Number },
        MotifRemise: { type: String, maxlength: 100 },
        Restapayer: { type: Number },
        DateEncaissement: { type: Date },
        TotalapayerPatient: { type: Number },
        SocieteP: { type: String, maxlength: 100 },
        PartAssuranceP: { type: Number },
        Partassure: { type: Number },
        Assurance: { type: String, maxlength: 50 },
        Taux: { type: String, maxlength: 4 },
        IDASSURANCE: { type: Schema.Types.ObjectId, ref: 'Assurance' },
        IDTYPE_ACTE: { type: String },
        FacturePar: { type: String, maxlength: 50 },
        idPatient: { type: Schema.Types.ObjectId, ref: 'Patient' },
        CompteClient: { type: Boolean },
        ModifierPar: { type: String, maxlength: 50 },
        HeureModif: { type: String, maxlength: 10 },
        IDAPPORTEUR: { type: Number },
        Entrele: { type: Date },
        SortieLe: { type: Date },
        Chambre: { type: String, maxlength: 50 },
        DureeE: { type: Number },
        Numcarte: { type: String, maxlength: 50 },
        Designationtypeacte: { type: String, maxlength: 100 },
        StatutFacture: { type: Boolean },
        Numfacture: { type: String, maxlength: 50 },
        NumBon: { type: String, maxlength: 50 },
        MontantMedecin: { type: Number },
        PartApporteur: { type: Number },
        idMedecin: { type: Schema.Types.ObjectId, ref: 'Medecin' },
        Statumed: { type: String, maxlength: 5 },
        BanqueC: { type: String, maxlength: 50 },
        NumChèque: { type: String, maxlength: 50 },
        Modepaiement: { type: String, maxlength: 50 },
        TotalReliquatPatient: { type: Number },
        CautionPatient: { type: Number },
        Assure: { type: String, maxlength: 25 },
        MontantMedecinExécutant: { type: Number },
        NummedecinExécutant: { type: String },
        MedecinExécutant: { type: String, maxlength: 50 },
        Payeoupas: { type: Boolean },
        resultatacte: { type: String },
        StatutApporteur: { type: String, maxlength: 5 },
        Statutexécutant: { type: String, maxlength: 5 },
        StatutLaboratoire: { type: Number },
        ObservationC: { type: String, maxlength: 120 },
        Receptionnerpar: { type: String, maxlength: 60 },
        Datetransferbiologiste: { type: Date },
        Transferepar: { type: String, maxlength: 60 },
        DATERECEPTIONNER: { type: Date },
        Heurereception: { type: String, maxlength: 10 },
        Heure_service: { type: String, maxlength: 10 },
        dateretour: { type: Date },
        Document: { type: Buffer },
        ExtensionF: { type: String, maxlength: 10 },
        Souscripteur: { type: String, maxlength: 60 },
        Heure_Facturation: { type: String, maxlength: 10 },
        CONCLUSIONGENE: { type: String, maxlength: 1000 },
        NumCarteVisa: { type: String, maxlength: 50 },
        NumCompteVisa: { type: String, maxlength: 50 },
        DateValidation: { type: Date },
        IDSOCIETEPARTENAIRE: { type: Schema.Types.ObjectId, ref: 'Societe' },
        ProvenanceExamen: { type: String, maxlength: 150 },
        NIdentificationExamen: { type: String, maxlength: 50 },
        Biologiste: { type: String, maxlength: 60 },
        CachetBiologiste: { type: Buffer },
        CachetMedecin: { type: Buffer },
        Externe_Interne: { type: String, maxlength: 15 },
        factureannule: { type: Boolean },
        ObservationHospitalisation: { type: String },
        IDCHAMBRE: { type: Schema.Types.ObjectId, ref: 'Chambre' },
        IDSOCIETEASSUANCE: { type: Schema.Types.ObjectId, ref: 'SocieteAssurance' },
        SOCIETE_PATIENT: { type: String, maxlength: 60 },
        statutPrescriptionMedecin:{type:Number},
    },
    { timestamps: true }
);
export const ExamenHospitalisation: Model<IExamenHospitalisation> = mongoose.models.ExamenHospitalisation || mongoose.model<IExamenHospitalisation>('ExamenHospitalisation', ExamenHospitalisationSchema);