export interface FactureRecap {
    Numfacture?: string;
    ACTE?: string;
    montantacte?: number;
    Partassure?: number;
    PartAssurance?: number;
    DebutF?: Date;
    FinF?: Date;
    DateSaisie?: Date;
    FactureAssur?: string; // ObjectId as string
    Assuance?: string;
    CreePar?: string;
    NCC?: string;
}
