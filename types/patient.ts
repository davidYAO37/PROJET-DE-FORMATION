// types.ts
export type Patient = {
  _id?: string; // facultatif lors de la création
  nom: string;
  prenoms: string;
  age: number;
  sexe: string;
  contact: string;
  codeDossier: string;
};
