export interface Prescription {
    legacyId?: number;
    Prescription?: string;
    PatientRef?: string;
    QtéP?: number;
    Posologie?: string;
    DatePres?: Date;
    Heure_Facturation?: string;
    prixunitaire?: number;
    PrixTotal?: number;
    nomMedicament?: string;
    PartAssurance?: number;
    Partassuré?: number;
    CodePrestation?: string;
    Medicament?: string;
    IDpriseCharge?: number;
    Reference?: string;
    ExclusionActae?: string;
    StatuPrescriptionMedecin?: number;
    ACTEPAYECAISSE?: string;
    Payele?: Date;
    PayéPar?: string;
    DatePaiement?: Date;
    Heure?: string;
    Facturation?: string;
    SocieteAssurance?: string;
    SOCIETE_PATIENT?: string;
}
