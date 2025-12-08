export interface HormoneTraitement {
    status: string;
    donnees: string;
    dateHormone: Date;
    id: string;
    numPatient: string;
    article: string;
    echantillon: string;
    CodePrestation: string;
    IDFAMILLE_ACTE_BIOLOGIE?: string;
    plagehormone: string;
    resultathor: string;
    Param_designation: string;
    unitehorm: string;
    CodeAscii: number;
    ValeurMinNormale: number;
    ValeurMaxNormale: number;
    DejaUtilise: boolean;
}
