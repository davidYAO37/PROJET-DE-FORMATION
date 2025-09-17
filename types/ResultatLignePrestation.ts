export interface ResultatLignePrestation {
    ParamAbrege?: string;
    Param_designation?: string;
    PlageMin?: number;
    PlageMax?: number;
    ValeurNormale?: string;
    ChampResultat?: string;
    IDPARAM_LABO?: string;
    IDLIGNE_PRESTATION?: string;
    IDACTEP?: string;
    IDHOSPITALISATION?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: string;
    ACTE?: string;
    Interpretation?: string;
    ProvenanceExamen?: string;
    Externe_Interne?: string;
    NIdentificationExamen?: string;
    TypeTexte?: boolean;
    AlignerActe?: number;
    unite?: string;
    ORdonnacementAffichage?: number;
}
