export type ServiceHospitalisation =
  | 'MED'
  | 'CHIR'
  | 'CHR.SP'
  | 'OBST'
  | 'GYN'
  | 'PED'
  | 'REA'
  | 'URG';

export type StatutRapportHospitalisation = 'brouillon' | 'a_valider' | 'valide' | 'annule' | 'a_completer';

export const normalizeRapportHospitalisationStatut = (statut?: StatutRapportHospitalisation): 'brouillon' | 'a_valider' | 'valide' | 'annule' => {
  if (statut === 'a_completer') return 'a_valider';
  return statut || 'brouillon';
};

export interface RapportHospitalisationForm {
  patientId: string;
  hospitalisationId?: string;
  patientNom?: string;
  patientPrenoms?: string;
  patientDateNaissance?: string | Date;
  patientSexe?: string;
  patientNumeroDossier?: string;
  patientAssurance?: string;
  dateEntree: string | Date;
  dateSortie?: string | Date;
  service?: ServiceHospitalisation | string;
  motifHospitalisation?: string;
  antecedentsMedicaux?: string;
  antecedentsChirurgicaux?: string;
  tensionArterielle?: string;
  temperature?: string;
  pouls?: string;
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
  conclusion?: string;
  dateRapport: string | Date;
  statut?: StatutRapportHospitalisation;
}
