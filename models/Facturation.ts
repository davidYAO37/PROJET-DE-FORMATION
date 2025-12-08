import mongoose, { Schema, model, Document, Types, Model } from 'mongoose';

export interface IFacturation extends Document {
    _id: Types.ObjectId | string;
    CodePrestation?: string;
    NomMed?: string;
    PatientP?: string;
    DatePres?: Date;
    SaisiPar?: string;
    Rclinique?: string;
    Montanttotal?: number;
    TotalPaye?: number;  //----
    TotaleTaxe?: number;//----
    MontantRecu?: number;
    reduction?: number;
    // tauxreduction?: number; a retirer
    MotifRemise?: string;
    Restapayer?: number;
    TotalapayerPatient?: number;
    SocieteP?: string;
    PartAssuranceP?: number;
    Partassure?: number;
    Taux?: string;
    Assurance?: Types.ObjectId;
    IDTYPE_ACTE?: string
    FacturePar?: string;
    CompteClient?: boolean;
    ModifierPar?: string;
    DateModif?: Date;
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
    Medecin?: Types.ObjectId;
    Statumed?: string;
    BanqueC?: string;
    NumCheque?: string;
    Modepaiement?: string;
    TotalReliquatPatient?: number;
    CautionPatient?: number;
    Assure?: string;
    MontantMedecinExécutant?: number;
    NummedecinExécutant?: number;
    MedecinExécutant?: string;
    Payeoupas?: boolean;
    resultatacte?: string;
    StatutLaboratoire?: number;
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
    StatutPrescriptionMedecin?: number;
    Fichedesuivipatient?: string;
    AnnulOrdonnerPar?: string;
    AnnulationOrdonneLe?: Date;
    AnnulerPar?: string;
    Annulerle?: Date;
    StatutPaiement?: string;
    MotifRetour?: string;
    MotifAnnulationFacture?: string;
    DateFacturation?: Date;
    idHospitalisation?: Types.ObjectId;
    IDPRESCRIPTION?: Types.ObjectId;
    typefacture?: string;
    IDSOCIETEASSURANCE?: Types.ObjectId;
    SOCIETE_PATIENT?: string;
    IdPatient?: Types.ObjectId;
    IDASSURANCE?: Types.ObjectId;
    IDMEDECIN?: Types.ObjectId;

}

const FacturationSchema = new Schema<IFacturation>(
    {
        CodePrestation: { type: String, maxlength: 50 },
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
        // tauxreduction: { type: Number },
        MotifRemise: { type: String, maxlength: 100 },
        Restapayer: { type: Number },
        TotalapayerPatient: { type: Number },
        SocieteP: { type: String, maxlength: 100 },
        PartAssuranceP: { type: Number },
        Partassure: { type: Number },
        Taux: { type: String, maxlength: 4 },
        Assurance: { type: Schema.Types.ObjectId, ref: 'Assurance' },
        IDTYPE_ACTE: { type: String },
        FacturePar: { type: String, maxlength: 50 },
        CompteClient: { type: Boolean },
        ModifierPar: { type: String, maxlength: 50 },
        DateModif: { type: Date },
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
        Medecin: { type: Schema.Types.ObjectId, ref: 'Medecin' },
        Statumed: { type: String, maxlength: 5 },
        BanqueC: { type: String, maxlength: 50 },
        NumCheque: { type: String, maxlength: 50 },
        Modepaiement: { type: String, maxlength: 50 },
        TotalReliquatPatient: { type: Number },
        CautionPatient: { type: Number },
        Assure: { type: String, maxlength: 25 },
        MontantMedecinExécutant: { type: Number },
        NummedecinExécutant: { type: Number },
        MedecinExécutant: { type: String, maxlength: 50 },
        Payeoupas: { type: Boolean },
        resultatacte: { type: String },
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
        StatutPrescriptionMedecin: { type: Number },
        Fichedesuivipatient: { type: String },
        AnnulOrdonnerPar: { type: String, maxlength: 50 },
        AnnulationOrdonneLe: { type: Date },
        AnnulerPar: { type: String, maxlength: 50 },
        Annulerle: { type: Date },
        StatutPaiement: { type: String, maxlength: 50 },
        MotifRetour: { type: String, maxlength: 500 },
        MotifAnnulationFacture: { type: String, maxlength: 500 },
        DateFacturation: { type: Date },
        idHospitalisation: { type: Schema.Types.ObjectId, ref: 'ExamenHospitalisation' },
        IDPRESCRIPTION: { type: Schema.Types.ObjectId, ref: 'Prescription' },
        typefacture: { type: String, maxlength: 2 },
        IDSOCIETEASSURANCE: { type: Schema.Types.ObjectId, ref: 'SocieteAssurance' },
        SOCIETE_PATIENT: { type: String, maxlength: 60 },
        IdPatient: { type: Schema.Types.ObjectId, ref: 'Patient' },
        IDASSURANCE: { type: Schema.Types.ObjectId, ref: 'Assurance' },
        IDMEDECIN: { type: Schema.Types.ObjectId, ref: 'Medecin' },
    },
    { timestamps: true }
);
export const Facturation: Model<IFacturation> = mongoose.models.Facturation || mongoose.model<IFacturation>("Facturation", FacturationSchema);