import {
  computeDureeJoursCalendar,
  dateInputToStartOfDay,
  normalizeTypeArretTravail,
  type TypeArretTravail,
} from '@/types/arretTravail';

export function buildNumeroDocumentArret(options: {
  patientCodeDossier?: string;
  sequence?: number;
}): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 11).toUpperCase();
  if (options.patientCodeDossier && options.sequence != null) {
    return `${options.patientCodeDossier}-AT-${year}-${String(options.sequence).padStart(4, '0')}`;
  }
  return `AT-${year}-${rand}`;
}

export function deriveDureeAndRepriseFromIsoDates(
  dateDebutIso: string,
  dateFinIso: string
): { dureeJours: number; dateRepriseIso: string } {
  if (!dateDebutIso || !dateFinIso) {
    return { dureeJours: 0, dateRepriseIso: '' };
  }
  const debut = dateInputToStartOfDay(dateDebutIso);
  const fin = dateInputToStartOfDay(dateFinIso);
  const dureeJours = computeDureeJoursCalendar(debut, fin);
  const reprise = new Date(fin);
  reprise.setDate(reprise.getDate() + 1);
  return {
    dureeJours,
    dateRepriseIso: reprise.toISOString().split('T')[0],
  };
}

export interface ArretTravailPrintInput {
  patientNom?: string;
  patientPrenoms?: string;
  dateDebut: Date | string;
  dateFin: Date | string;
  dateCreation: Date | string;
  motif: string;
  observations?: string;
  medecinTraitant: string;
  typeArret: string;
  numeroDocument: string;
  dateReprise?: Date | string;
  certificatMedical?: boolean;
  numeroCertificat?: string;
  medecinCertificat?: string;
  dateCertificat?: Date | string;
  dateAccident?: Date | string;
  termeGrossesse?: string;
  dateEntreeHospitalisation?: Date | string;
  dateSortieHospitalisation?: Date | string;
  interventionChirurgicale?: string;
  suiviPsychologique?: string;
  precisionsIsolement?: string;
}

export function resolveTypePourImpression(typeArret: string): TypeArretTravail {
  return normalizeTypeArretTravail(typeArret);
}
