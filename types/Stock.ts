export interface Stock {
    legacyId?: number;
    Reference?: string;
    QteEnStock?: number;
    QteStockVirtuel?: number;
    AuteurModif?: string;
    DateModif?: Date;
    Medicament?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
