export interface EntreeStock {
    legacyId?: number;
    DateAppro?: Date;
    Quantite?: number;
    PrixAchat?: number;
    PRIXTHT?: number;
    TVAEntree?: number;
    MontantTTCE?: number;
    SaisiPar?: string;
    SaisiLe?: Date;
    Observations?: string;
    Reference?: string;
    Approvisionnement?: string | null;
    PrixVente?: number;
    Medicament?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
