export type ModeVente = "DETAIL" | "BOITE";

export interface SortieStock {
    legacyId?: number;
    DateSortie?: Date;
    Reference?: string;
    MedicamentId?:string;
    Quantite?: number;
    QteConditionnement?: number;
    Prix_unitaire?: number;
    Prix_TotalS?: number;
    Motif?: string;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: Date;
    ArticleS?: string;
    ModeVente?: ModeVente;
    Prescription?: string | null;
    Patient?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
