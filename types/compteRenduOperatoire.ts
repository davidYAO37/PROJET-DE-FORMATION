
export const COMPTE_RENDU_OPERATOIRE_TYPES = [
    'chirurgie_generale',
    'orthopedie',
    'gynecologie',
    'urologie',
    'ophtalmologie',
    'orl',
    'dentaire',
    'cardiovasculaire',
    'neurologie',
    'autre',
] as const;

export type TypeCompteRenduOperatoire = (typeof COMPTE_RENDU_OPERATOIRE_TYPES)[number];

export const COMPTE_RENDU_OPERATOIRE_STATUTS = ['brouillon', 'a_valider', 'valide', 'annule', 'planifie', 'en_cours', 'termine'] as const;
export type StatutCompteRenduOperatoire = (typeof COMPTE_RENDU_OPERATOIRE_STATUTS)[number];

export const normalizeCompteRenduOperatoireStatut = (statut: StatutCompteRenduOperatoire): 'brouillon' | 'a_valider' | 'valide' | 'annule' => {
    if (statut === 'planifie') return 'brouillon';
    if (statut === 'en_cours') return 'a_valider';
    if (statut === 'termine') return 'valide';
    return statut;
};

export const COMPTE_RENDU_OPERATOIRE_LABELS: Record<TypeCompteRenduOperatoire, string> = {
    chirurgie_generale: 'Chirurgie générale',
    orthopedie: 'Orthopédie',
    gynecologie: 'Gynécologie',
    urologie: 'Urologie',
    ophtalmologie: 'Ophtalmologie',
    orl: 'ORL',
    dentaire: 'Dentaire',
    cardiovasculaire: 'Cardiovasculaire',
    neurologie: 'Neurologie',
    autre: 'Autre',
};