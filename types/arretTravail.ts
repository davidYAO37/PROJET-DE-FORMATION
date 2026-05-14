/**
 * Domaine arrêt de travail — types, constantes et helpers partagés (UI, API, impression).
 */

export const ARRET_TRAVAIL_TYPES = [
  'maladie',
  'accident_travail',
  'maladie_professionnelle',
  'prolongation',
  'maternite',
  'paternite',
  'grossesse_pathologique',
  'conge_enfant_malade',
  'conge_proche_aidant',
  'arret_derogatoire',
  'hospitalisation',
  'repos_post_operatoire',
  'isolement_medical',
  'autre',
] as const;

export type TypeArretTravail = (typeof ARRET_TRAVAIL_TYPES)[number];

export const ARRET_TRAVAIL_STATUTS = ['en_cours', 'termine', 'annule'] as const;
export type StatutArretTravail = (typeof ARRET_TRAVAIL_STATUTS)[number];

/** Types pour lesquels le formulaire affiche et privilégie le bloc certificat (n°, date, médecin). */
export const ARRET_TRAVAIL_TYPES_BLOC_CERTIFICAT: readonly TypeArretTravail[] = [
  'accident_travail',
  'maladie_professionnelle',
  'hospitalisation',
  'prolongation',
] as const;

export function typeArretAfficheBlocCertificat(type: TypeArretTravail): boolean {
  return (ARRET_TRAVAIL_TYPES_BLOC_CERTIFICAT as readonly string[]).includes(type);
}

export const ARRET_TRAVAIL_LABELS: Record<TypeArretTravail, string> = {
  maladie: 'Maladie (avis d’arrêt ordinaire)',
  accident_travail: 'Accident du travail',
  maladie_professionnelle: 'Maladie professionnelle',
  prolongation: 'Prolongation d’arrêt',
  maternite: 'Congé maternité',
  paternite: 'Congé paternité / accueil du enfant',
  grossesse_pathologique: 'Grossesse pathologique',
  conge_enfant_malade: 'Congé enfant malade / présence parentale',
  conge_proche_aidant: 'Congé proche aidant',
  arret_derogatoire: 'Arrêt dérogatoire',
  hospitalisation: 'Hospitalisation',
  repos_post_operatoire: 'Repos post-opératoire',
  isolement_medical: 'Isolement médical',
  autre: 'Autre situation',
};

export const ARRET_TRAVAIL_STATUT_LABELS: Record<StatutArretTravail, string> = {
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

export const ARRET_TRAVAIL_STATUT_BADGES: Record<StatutArretTravail, string> = {
  en_cours: 'warning',
  termine: 'success',
  annule: 'danger',
};

export type ArretTravailTextesImpression = {
  /** Titre affiché en tête du document imprimé */
  titreOfficiel: string;
  /** Paragraphe d’orientation clinique / administrative */
  descriptionMedicale: string;
  /** Mention légale, réglementaire ou explicative */
  mentionLegale: string;
  /** Phrase d’introduction avant la durée en jours */
  phraseDuree: string;
};

export const ARRET_TRAVAIL_TEXTES: Record<TypeArretTravail, ArretTravailTextesImpression> = {
  maladie: {
    titreOfficiel: 'Avis d’arrêt de travail pour maladie',
    descriptionMedicale:
      'Document attestant l’incapacité temporaire de travail pour maladie non professionnelle. Les suites à donner (transmission employeur, caisse) relèvent du régime de sécurité sociale applicable.',
    mentionLegale:
      'Le patient est informé des obligations de transmission des volets prévus par la réglementation en vigueur (employeur, organismes compétents).',
    phraseDuree: 'Et que son état de santé nécessite un arrêt de travail de :',
  },
  accident_travail: {
    titreOfficiel: 'Certificat médical — Accident du travail',
    descriptionMedicale:
      'Certificat initial ou de suivi relatif à un accident du travail. Les constations cliniques et le lien avec l’accident doivent figurer au dossier médical ; la déclaration aux organismes compétents incombe aux parties concernées dans les délais légaux.',
    mentionLegale:
      'Document à conserver au dossier médical et à transmettre selon les modalités prévues pour les accidents du travail (employeur, assurance / caisse).',
    phraseDuree: 'Et que son état nécessite une interruption d’activité professionnelle de :',
  },
  maladie_professionnelle: {
    titreOfficiel: 'Certificat médical — Maladie professionnelle',
    descriptionMedicale:
      'Certificat relatif à une pathologie d’origine professionnelle reconnue ou en cours d’évaluation. La filière indemnisation et de reconnaissance relève des procédures administratives spécifiques.',
    mentionLegale:
      'Les suites administratives relèvent du tableau des maladies professionnelles et des organismes compétents ; ce certificat ne vaut pas reconnaissance automatique.',
    phraseDuree: 'Et que son état nécessite une interruption d’activité professionnelle de :',
  },
  prolongation: {
    titreOfficiel: 'Prolongation d’arrêt de travail',
    descriptionMedicale:
      'Document prolongeant un arrêt initial pour le même motif ou évolution clinique. La période indiquée se substitue ou prolonge la période précédente selon les règles du régime applicable.',
    mentionLegale:
      'La prolongation doit être cohérente avec l’avis initial et l’état clinique actuel ; en cas de changement de pathologie, un nouvel avis peut être requis.',
    phraseDuree: 'Et que son état de santé nécessite une prolongation d’arrêt de travail de :',
  },
  maternite: {
    titreOfficiel: 'Congé maternité — Attestation médicale',
    descriptionMedicale:
      'Attestation relative au congé maternité lié à la grossesse et à la période périnatale, dans le respect des indications obstétricales.',
    mentionLegale:
      'Les droits et durées de congé relèvent du code du travail et des dispositions conventionnelles applicables.',
    phraseDuree: 'Et que son état de santé nécessite un congé maternité de :',
  },
  paternite: {
    titreOfficiel: 'Congé paternité / accueil du enfant',
    descriptionMedicale:
      'Attestation médicale en lien avec le congé de paternité ou d’accueil du enfant lorsque l’état du patient ou du nouveau-né le justifie.',
    mentionLegale:
      'Les modalités d’indemnisation et de durée sont fixées par la législation et la convention collective le cas échéant.',
    phraseDuree: 'Et que son état de santé nécessite un congé paternité / d’accueil de :',
  },
  grossesse_pathologique: {
    titreOfficiel: 'Arrêt de travail — Grossesse pathologique',
    descriptionMedicale:
      'Arrêt lié à des complications de la grossesse nécessitant une interruption ou une réduction d’activité sur prescription médicale.',
    mentionLegale:
      'Le suivi obstétrical et les échanges avec le médecin conseil peuvent être nécessaires selon les situations.',
    phraseDuree: 'Et que son état de santé nécessite un arrêt pour grossesse pathologique de :',
  },
  conge_enfant_malade: {
    titreOfficiel: 'Congé enfant malade / présence parentale',
    descriptionMedicale:
      'Document justifiant l’absence pour garde d’un enfant malade ou présence parentale, sur la base de l’examen clinique ou des éléments fournis.',
    mentionLegale:
      'Les conditions d’ouverture des droits relèvent de la sécurité sociale et de l’employeur ; ce document atteste uniquement la nécessité médicale d’accompagnement.',
    phraseDuree: 'Et que cette situation nécessite un congé pour enfant malade / présence parentale de :',
  },
  conge_proche_aidant: {
    titreOfficiel: 'Congé proche aidant',
    descriptionMedicale:
      'Attestation en faveur d’un proche aidant prenant en charge une personne en perte d’autonomie ou en situation de dépendance lourde.',
    mentionLegale:
      'L’indemnisation et la durée maximale dépendent du dispositif légal applicable ; transmission aux organismes selon les règles en vigueur.',
    phraseDuree: 'Et que cette situation nécessite un congé proche aidant de :',
  },
  arret_derogatoire: {
    titreOfficiel: 'Arrêt de travail dérogatoire',
    descriptionMedicale:
      'Arrêt prononcé dans un cadre dérogatoire (situation sanitaire exceptionnelle, mesure spécifique), avec justification clinique au dossier.',
    mentionLegale:
      'Les fondements juridiques de la dérogation doivent être respectés ; ce document ne remplace pas les actes administratifs éventuellement requis.',
    phraseDuree: 'Et que son état nécessite un arrêt dérogatoire de :',
  },
  hospitalisation: {
    titreOfficiel: 'Certificat d’hospitalisation / incapacité temporaire',
    descriptionMedicale:
      'Attestation d’hospitalisation ou de suite de soins nécessitant une interruption d’activité professionnelle pendant la période indiquée.',
    mentionLegale:
      'Les pièces justificatives complémentaires (compte rendu d’hospitalisation) peuvent être demandées par les tiers payeurs ou l’employeur.',
    phraseDuree: 'Et que son état nécessite une interruption d’activité pour hospitalisation / soins de :',
  },
  repos_post_operatoire: {
    titreOfficiel: 'Repos post-opératoire',
    descriptionMedicale:
      'Prescription de repos et d’arrêt de travail consécutifs à une intervention chirurgicale, en fonction du geste et du terrain.',
    mentionLegale:
      'La reprise d’activité doit être réévaluée selon l’évolution ; tout travail contre-indiqué médicalement engage la responsabilité des parties.',
    phraseDuree: 'Et que son état nécessite un repos post-opératoire équivalent à un arrêt de travail de :',
  },
  isolement_medical: {
    titreOfficiel: 'Isolement médical — Incapacité temporaire',
    descriptionMedicale:
      'Arrêt lié à une mesure d’isolement pour raison infectieuse ou sanitaire, sur indication médicale documentée.',
    mentionLegale:
      'Les obligations déclaratoires éventuelles (autorités sanitaires) restent applicables selon le contexte.',
    phraseDuree: 'Et que son état nécessite un isolement médical avec arrêt de travail de :',
  },
  autre: {
    titreOfficiel: 'Attestation d’incapacité temporaire de travail',
    descriptionMedicale:
      'Document établi pour une situation ne correspondant pas aux rubriques standardisées ; le motif détaillé figure ci-dessous.',
    mentionLegale:
      'Les suites administratives dépendent de l’analyse des organismes compétents au vu des pièces transmises.',
    phraseDuree: 'Et que son état de santé nécessite une interruption d’activité de :',
  },
};

export function getTextesImpression(type: TypeArretTravail): ArretTravailTextesImpression {
  return ARRET_TRAVAIL_TEXTES[type] ?? ARRET_TRAVAIL_TEXTES.autre;
}

export function isTypeArretTravail(value: string): value is TypeArretTravail {
  return (ARRET_TRAVAIL_TYPES as readonly string[]).includes(value);
}

/** Sécurise les anciens enregistrements ou valeurs corrompues. */
export function normalizeTypeArretTravail(value: string | undefined | null): TypeArretTravail {
  if (value && isTypeArretTravail(value)) return value;
  return 'maladie';
}

export function computeDureeJoursCalendar(dateDebut: Date, dateFin: Date): number {
  const d0 = new Date(dateDebut);
  const d1 = new Date(dateFin);
  d0.setHours(0, 0, 0, 0);
  d1.setHours(0, 0, 0, 0);
  const ms = d1.getTime() - d0.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function dateInputToStartOfDay(isoDate: string): Date {
  const d = new Date(isoDate + 'T12:00:00');
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayStart(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function formatDateFr(d: Date | string | undefined | null): string {
  if (d == null || d === '') return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
}

/** Champs optionnels selon le type (certificat / dossier). */
export interface ArretTravailChampsSpecifiques {
  /** Date de l’accident (vie courante, AT ou contexte lésionnel) — saisie ISO AAAA-MM-JJ */
  dateAccident: string;
  /** Terme prévu ou suivi obstétrical (texte libre, ex. date prévue) */
  termeGrossesse: string;
  dateEntreeHospitalisation: string;
  dateSortieHospitalisation: string;
  /** Nature de l’intervention (post-opératoire) */
  interventionChirurgicale: string;
  /** Suivi psychologique / psychiatrique (arrêt dérogatoire / raison médicale sensible) */
  suiviPsychologique: string;
  /** Mesure ou durée d’isolement, contexte infectieux (isolement médical) */
  precisionsIsolement: string;
}

export type ArretTravailChampsSpecifiquesVisibilite = {
  dateAccident: boolean;
  termeGrossesse: boolean;
  hospitalisationDates: boolean;
  interventionChirurgicale: boolean;
  suiviPsychologique: boolean;
  precisionsIsolement: boolean;
};

/** Indique quels champs spécifiques afficher pour le type d’arrêt sélectionné. */
export function visibiliteChampsSpecifiquesArret(type: TypeArretTravail): ArretTravailChampsSpecifiquesVisibilite {
  return {
    dateAccident: ['maladie', 'autre', 'accident_travail', 'maladie_professionnelle'].includes(type),
    termeGrossesse: ['maternite', 'grossesse_pathologique', 'paternite'].includes(type),
    hospitalisationDates: type === 'hospitalisation',
    interventionChirurgicale: type === 'repos_post_operatoire',
    suiviPsychologique: type === 'arret_derogatoire',
    precisionsIsolement: type === 'isolement_medical',
  };
}

export interface ArretTravailFormPayload extends ArretTravailChampsSpecifiques {
  dateDebut: string;
  dateFin: string;
  motif: string;
  medecinTraitant: string;
  statut: StatutArretTravail;
  typeArret: TypeArretTravail;
  observations: string;
  certificatMedical: boolean;
  numeroCertificat: string;
  medecinCertificat: string;
  dateCertificat: string;
  dureeJours: number;
  dateReprise: string;
}
