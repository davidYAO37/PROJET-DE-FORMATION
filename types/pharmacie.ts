export type TypeArticle = "PHARMACIE" | "LABORATOIRE";
export type TypeConditionnement = "BOITE" | "FLACON" | "TUBE" | "AMPLOULE" | "SACHET" | "AUTRE";

export interface Pharmacie {
    _id?: string;
    Reference?: string;
    Designation: string;
    PrixAchat?: number;
    PrixVente?: number;
    TypeArticle?: TypeArticle;
    ConditionnementAchat?: TypeConditionnement;
    QteParConditionnement?: number;
    UniteVente?: string;
    PrixAchatConditionnement?: number;
    PrixVenteConditionnement?: number;
    PrixVenteUnite?: number;
    VenteParDetail?: boolean;
    Ajouter?: Date;
}
