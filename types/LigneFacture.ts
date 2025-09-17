export interface LigneFacture {
    DateFacture?: Date;
    TotalHT?: number;
    FactureAssur?: string; // ObjectId as string
    ACTEF?: string;
    Partassure?: number;
    PartAssurance?: number;
    Totalacte?: number;
    SaisiLe?: Date;
    SaisiPar?: string;
    TYPEACTE?: string;
    Matricule?: string;
    NumBon?: string;
    IDHOSPITALISATION?: string;
    IDCONSULTATION?: string;
    IDPRESCRIPTION?: string;
    IDANNALYSE?: string;
    IDMAGERIE?: string;
    IDCHIRURGIE?: string;
    Beneficiaire?: string;
    SOCIETE_PATIENT?: string;
}
