export interface StatistiquesFilters {
  dateDebut: string;
  dateFin: string;
  medecinId?: string;
  service?: string;
  typeExamen?: string;
}

export interface ChartDetail {
  date?: string | Date;
  patient?: string;
  medecin?: string;
  designation?: string;
  prestation?: string;
  montant?: number;
  sexe?: string;
  type?: string;
  codeDossier?: string;
  statut?: string;
}

export interface ClassementActeStat {
  acte: string;
  total: number;
  details: ChartDetail[];
}

export interface PrescriptionMedecinStat {
  medecin: string;
  total: number;
  femmes: number;
  hommes: number;
  details: ChartDetail[];
}

export interface ResultatInterneExterneStat {
  type: string;
  total: number;
  details: ChartDetail[];
}

export interface ExamenSexeStat {
  sexe: string;
  total: number;
  details: ChartDetail[];
}

export interface MontantActeStat {
  acte: string;
  montant: number;
  nombre: number;
  details: ChartDetail[];
}

export interface PatientMedecinStat {
  medecin: string;
  patients: number;
  consultations: number;
  details: ChartDetail[];
}

export interface EvolutionConsultationStat {
  date: string;
  consultations: number;
  rendezVous: number;
}

export interface RepartitionSexeStat {
  sexe: string;
  total: number;
  details: ChartDetail[];
}

export interface HospitalisationStat {
  statut: string;
  total: number;
  montant: number;
  details: ChartDetail[];
}

export interface StatistiquesDashboardData {
  periode: {
    dateDebut: string | Date;
    dateFin: string | Date;
  };
  kpis: {
    consultations: number;
    patients: number;
    prescriptionsBiologiques: number;
    montantTotal: number;
    hospitalisations: number;
  };
  classementActes: ClassementActeStat[];
  prescriptionParMedecin: PrescriptionMedecinStat[];
  resultatInterneExterne: ResultatInterneExterneStat[];
  examenParSexe: ExamenSexeStat[];
  montantActes: MontantActeStat[];
  patientsParMedecin: PatientMedecinStat[];
  evolutionConsultations: EvolutionConsultationStat[];
  repartitionHommeFemme: RepartitionSexeStat[];
  hospitalisations: HospitalisationStat[];
}
