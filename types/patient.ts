// types.ts
export type Patient = {
  _id?: string; // facultatif lors de la création
  Nom?: string;
  Prenoms?: string;
  Age_partient?: number;
  sexe?: string;
  Contact?: string;
  Code_dossier?: string;
  Matricule?: string;
  Date_naisse?: Date;
  Taux?: number;
  IDASSURANCE?: string; // Référence à l'assurance
  SOCIETE_PATIENT?: string;
  Souscripteur?: string;
  TarifPatient?: string;
  assurance?: string; // facultatif, référence à l'assurance
};
