export type ServiceHospitalisation =
  | 'MED'
  | 'CHIR'
  | 'CHR.SP'
  | 'OBST'
  | 'GYN'
  | 'PED'
  | 'REA'
  | 'URG';

export interface RapportHospitalisationForm {
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateEntree: string | Date;
  dateSortie: string | Date;
  service: ServiceHospitalisation | string;
  motifHospitalisation: string;
  diagnosticAdmission: string;
  diagnosticFinal: string;
  histoireMaladie: string;
  examenClinique: string;
  examensParacliniques?: string;
  traitementAdministre: string;
  evolution: string;
  complications?: string;
  suitesHospitalisation: string;
  medecinTraitant: string;
  medecinChefService?: string;
  recommandations: string;
  dateRapport: string | Date;
}
