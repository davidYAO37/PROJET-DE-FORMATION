export type TypeArticle = "PHARMACIE" | "LABORATOIRE";

export interface Pharmacie {
    _id?: string;
    Reference?: string;
    Designation: string;
    PrixAchat?: number;
    PrixVente?: number;
    TypeArticle?: TypeArticle;
    Ajouter?: Date;
}
