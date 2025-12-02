// types/ExamenHospitalisation.ts
export type Acte = {
    designation: string;
    lettreCle: string;
    prixUnitaire: number;
    quantite: number;
    prixTotal: number;
    coef: number;
    coefAssur?: number;
    surplus: number;
    montantMedecin: number;
    _id?: string;
    date?: string;
    idFamille?: string;
    idType?: string;
    montantacte?: number;
    montantAssurance?: number;
    montantPatient?: number;
    montantSurplus?: number;
    montantReliquat?: number;
    montantTotal?: number;
    idActe?: string;
    idExamenHospitalisation?: string;
    idActeClinique?: string;
    partAssurance?: number;
    Partassure?: number;
    reliquat?: number;
    totalRelicatCoefAssur?: number;
    montantMedExecutant?: number

};

export type Assurance = {
    assuranceId: string;
    type: string;
    taux: number;
    matricule: string;
    numeroBon: string;
    societe: string;
    numero: string;
    adherent: string;
};

export type ExamenHospitalisationForm = {
    patientId: string;
    medecinId: string;
    dateEntree: string;
    dateSortie: string;
    DatePres: Date;
    nombreDeJours: number;
    diagnostic: string;
    observations: string;
    actes: Acte[];
    typeacte: string;
    Assure: string
    medecinPrescripteur: string;
    assurance: Assurance;
    factureTotal: number;
    resteAPayer: number;
    partAssurance: number;
    Partassure: number;
    surplus: number;
    renseignementclinique: string;
    societePatient: string;
    Code_Prestation: string
    Designationtypeacte: string
    reduction: number;
    MotifRemise: string;
    TotalapayerPatient: number;
    // Legacy / alternate field names (optional) used across the codebase
    PatientP?: string;
    IdPatient?: string;
    MontantRecu?: number;
    IDASSURANCE?: string;
    Souscripteur?: string;
    SOCIETE_PATIENT?: string;
    TotalPaye?: number;
    Taux?: number;
    NumBon?: string;
    numeroBon?: string;
    NomMed?: string;
    Numcarte?: string;
    IDTYPE_ACTE?: string;
    Payeoupas?: boolean;
    TotalReliquatPatient?: number;
    StatutPaiement?: string;
    tauxreduction?: number;
    Modepaiement?: string;
    MontantMedecinExécutant?: number;
    TotaleTaxe?: number;
    Assuré?: boolean;
    IDMEDECIN?: string;

};

// ✅ Valeur par défaut centralisée
export const defaultFormData: ExamenHospitalisationForm = {
    patientId: "",
    medecinId: "",
    dateEntree: "",
    dateSortie: "",
    DatePres: new Date(),
    nombreDeJours: 0,
    diagnostic: "",
    observations: "",
    actes: [],
    typeacte: "",
    Assure: "NON ASSURE",
    medecinPrescripteur: "",
    renseignementclinique: "",
    societePatient: "",
    assurance: {
        assuranceId: "",
        type: "",
        taux: 0,
        matricule: "",
        numeroBon: "",
        societe: "",
        numero: "",
        adherent: "",
    },
    factureTotal: 0,
    resteAPayer: 0,
    partAssurance: 0,
    Partassure: 0,
    surplus: 0,
    Code_Prestation: "",
    Designationtypeacte: "",
    reduction: 0,
    MotifRemise: "",
    TotalapayerPatient: 0
};
