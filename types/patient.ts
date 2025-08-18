// types.ts
export type Patient = {
  _id?: string; // facultatif lors de la création
  nom?: string;
  prenoms?: string;
  age?: number;
  sexe?: string;
  contact?: string;
  typevisiteur?: string; // facultatif
  codeDossier?: string;
  matriculepatient?: string; // facultatif
  dateNaissance?: Date; // facultatif
  tauxassurance?: number; // facultatif
  assurance?: string; // facultatif, référence à l'assurance

};
