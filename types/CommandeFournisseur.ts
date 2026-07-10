export type StatutCommande = "BROUILLON" | "ENVOYEE" | "RECEPTION_PARTIELLE" | "SOLDEE" | "ANNULEE";
export type TypeArticle = "PHARMACIE" | "LABORATOIRE";

export interface LigneCommande {
    _id?: string;
    IDMEDICAMENT?: string;
    Medicament?: string;
    Reference?: string;
    TypeArticle?: TypeArticle;
    QteCommandee: number;
    QteRecue?: number;
    PrixAchat?: number;
    PrixVente?: number;
    TVA?: number;
    TotalHT?: number;
    TotalTTC?: number;
}

export interface CommandeFournisseur {
    _id?: string;
    NumeroCommande?: string;
    DateCommande?: string | Date;
    DateLivraisonPrevue?: string | Date;
    IDFournisseur?: string | null;
    NomFournisseur?: string;
    Statut?: StatutCommande;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: string | Date;
    PrixHT?: number;
    TotalTVA?: number;
    MontantTTC?: number;
    IDApprovisionnement?: string | null;
    entrepriseId?: string;
    lignes?: LigneCommande[];
}
