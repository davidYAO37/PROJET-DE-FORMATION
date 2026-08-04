export type ServiceHospitalisation =
  | 'MED'
  | 'CHIR'
  | 'CHR.SP'
  | 'OBST'
  | 'GYN'
  | 'PED'
  | 'REA'
  | 'URG';

export type StatutRapportHospitalisation = 'brouillon' | 'a_completer' | 'valide';

export interface RapportHospitalisationForm {
  patientId: string;
  hospitalisationId?: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateEntree: string | Date;
  dateSortie?: string | Date;
  service?: ServiceHospitalisation | string;
  motifHospitalisation?: string;
  diagnosticAdmission?: string;
  diagnosticFinal?: string;
  histoireMaladie?: string;
  examenClinique?: string;
  examensParacliniques?: string;
  traitementAdministre?: string;
  evolution?: string;
  complications?: string;
  suitesHospitalisation?: string;
  medecinTraitant?: string;
  medecinChefService?: string;
  recommandations?: string;
  dateRapport: string | Date;
  statut?: StatutRapportHospitalisation;
}
