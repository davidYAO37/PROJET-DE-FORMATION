export interface ParamLabo {
    _id?: string;
    NUM_PARAM?: number;
    ParamAbrege?: string;
    Param_designation?: string;
    PlageRefMinNe?: number;
    PlageRefMaxNé?: number;
    UnitéParam?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: string;
    PlageMinMaxNé?: string;
    PlageMinEnfant?: number;
    PlageMaxEnfant?: number;
    PlageMinMaxEnfant?: string;
    PLageMinFemme?: number;
    PlageMaxFemme?: number;
    PlageMinMaxFemme?: string;
    PlageMinHomme?: number;
    PlageMaxHomme?: number;
    PlageMinMaxHomme?: string;
    ValeurNormale?: string;
    ValeurMinNormale?: number;
    ValeurMaxNormale?: number;
    TypeTexte?: boolean;
    // Ajouter les champs de signe
    SigneNormale?: string;
    SigneNé?: string;
    SigneEnfant?: string;
    SigneFemme?: string;
    SigneHomme?: string;
}
