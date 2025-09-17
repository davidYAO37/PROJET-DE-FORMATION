export interface Approvisionnement {
    _id?: string;
    legacyId?: number;
    DateAppro?: Date;
    PrixHT?: number;
    tVAApro?: number;
    Transport?: number;
    MontantTTC?: number;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
