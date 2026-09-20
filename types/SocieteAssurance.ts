export interface SocieteAssurance {
    _id?: string;
    legacyId?: number;
    Assurance: string;
    societe?: string;
    SOCIETE_PATIENT?: string;
    accepteSurplus?: boolean | null;
    utiliseTarifsPropres?: boolean;
}
