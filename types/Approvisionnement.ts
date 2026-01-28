export interface Approvisionnement {
    _id?: string;
    DateAppro?: string | Date;
    PrixHT?: number;
    tVAApro?: number;
    Transport?: number;
    MontantTTC?: number;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: string | Date;
}