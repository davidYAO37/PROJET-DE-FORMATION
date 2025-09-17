export interface FactureAssur {
    Reference?: string;
    Saisirpar?: string;
    Date?: Date;
    etat_facture?: boolean;
    DateDepot?: Date;
    DepotPar?: string;
    DateRetrait?: Date;
    RetirePar?: string;
    NumChèque?: string;
    MontantTotalFacture?: number;
    Partassure?: number;
    PartAssurance?: number;
    DebutF?: Date;
    FinF?: Date;
    Assuance?: string;
    TYPEACTE?: string;
    TotalPaye?: number;
    Restapayer?: number;
}
