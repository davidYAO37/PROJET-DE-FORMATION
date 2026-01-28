export interface EntreeStock {
    _id?:String;
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
    IDAppro?: string | null;
    PrixVente?: number;
    Medicament?: string;
    IDMEDICAMENT?:string,
    createdAt?: Date;
    updatedAt?: Date;
}
