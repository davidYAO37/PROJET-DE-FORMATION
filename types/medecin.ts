export type Medecin = {
  _id?: string; // facultatif lors de la création       
  nom?: string;
  prenoms?: string;
  specialite?: string;
  TauxHonoraire?: number;
  TauxPrescription?: number;
  TauxExecution?: number;
};