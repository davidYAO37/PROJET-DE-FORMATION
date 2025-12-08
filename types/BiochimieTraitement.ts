export interface BiochimieTraitement {
    _id?: string;
    type_echantillon: string;
    cdbar: string;
    service: string;
    Sexe: string;
    Age_partient: number;
    date_analyse: string;
    Diagnostic: string;
    id_patient: string;
    date_naissance: Date;
    IDMEDECIN?: string;
    chim: string;
    resultat: string;
    unite: string;
    marque: string;
    plage: string;
    data: string;
    id_biochimie: string;
    CodePrestation: string;
}
