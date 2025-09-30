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
    partPatient?: number;
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
    partPatient: number;
    surplus: number;
    renseignementclinique: string;

};

// ✅ Valeur par défaut centralisée
export const defaultFormData: ExamenHospitalisationForm = {
    patientId: "",
    medecinId: "",
    dateEntree: "",
    dateSortie: "",
    nombreDeJours: 0,
    diagnostic: "",
    observations: "",
    actes: [],
    typeacte: "",
    Assure: "NON ASSURE",
    medecinPrescripteur: "",
    renseignementclinique: "",
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
    partPatient: 0,
    surplus: 0,
};
