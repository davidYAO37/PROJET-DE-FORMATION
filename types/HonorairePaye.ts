export interface HonorairePaye {
    legacyId?: number;
    Date?: Date;
    Heure?: string;
    MontantJour?: number;
    MontantPayé?: number;
    Restapayer?: number;
    PayéPar?: string;
    Recupar?: string;
    Medecin?: string | null;
    HonoraireMed?: string | null;
    BanqueC?: string;
    NCheque?: string;
    Modepaiement?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
