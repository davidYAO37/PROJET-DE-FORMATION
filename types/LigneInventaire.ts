export interface LigneInventaire {
    legacyIdInventaire?: number;
    Reference?: string;
    FAMILLEC?: string;
    LibeleProduit?: string;
    StockMachine?: number;
    StockTrouver?: number;
    Manquant?: number;
    Dateinventaire?: Date;
    ObservationC?: string;
    Inventaire?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
