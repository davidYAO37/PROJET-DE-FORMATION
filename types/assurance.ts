export interface Assurance {
    _id?: string; // facultatif lors de la création   
    desiganationassurance: string;
    codeassurance: string;
    telephone: string;
    email: string;
}

// Type étendu pour la saisie dans les formulaires hospitalisation/examen
export type AssuranceForm = {
    type: "NON_ASSURE" | "MUTUALISTE" | "ASSURE";
    taux: number;
    numeroBon: string;
    matricule: string;
    societe: string;
    numero: string;
    adherent: string;
};