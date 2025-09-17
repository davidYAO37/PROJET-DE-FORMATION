export interface SortieStock {
    legacyId?: number;
    DateSortie?: Date;
    Reference?: string;
    Quantite?: number;
    Prix_unitaire?: number;
    Prix_TotalS?: number;
    Motif?: string;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: Date;
    ArticleS?: string;
    Prescription?: string | null;
    Patient?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
