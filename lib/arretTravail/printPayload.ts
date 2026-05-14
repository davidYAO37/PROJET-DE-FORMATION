import type { ArretTravailFormPayload } from '@/types/arretTravail';
import type { ArretTravailPrintInput } from '@/lib/arretTravail/business';

/** Construit l’entrée d’impression à partir du formulaire (aperçu ou brouillon avant enregistrement). */
export function buildArretTravailPrintInputFromForm(params: {
  form: ArretTravailFormPayload;
  patientNom?: string;
  patientPrenoms?: string;
  numeroDocument: string;
}): ArretTravailPrintInput {
  const { form, patientNom, patientPrenoms, numeroDocument } = params;
  return {
    patientNom,
    patientPrenoms,
    dateDebut: form.dateDebut || new Date().toISOString().split('T')[0],
    dateFin: form.dateFin || new Date().toISOString().split('T')[0],
    dateCreation: new Date(),
    motif: form.motif,
    observations: form.observations,
    medecinTraitant: form.medecinTraitant,
    typeArret: form.typeArret,
    numeroDocument,
    dateReprise: form.dateReprise,
    certificatMedical: form.certificatMedical,
    numeroCertificat: form.numeroCertificat,
    medecinCertificat: form.medecinCertificat,
    dateCertificat: form.dateCertificat,
    dateAccident: form.dateAccident || undefined,
    termeGrossesse: form.termeGrossesse?.trim() || undefined,
    dateEntreeHospitalisation: form.dateEntreeHospitalisation || undefined,
    dateSortieHospitalisation: form.dateSortieHospitalisation || undefined,
    interventionChirurgicale: form.interventionChirurgicale?.trim() || undefined,
    suiviPsychologique: form.suiviPsychologique?.trim() || undefined,
    precisionsIsolement: form.precisionsIsolement?.trim() || undefined,
  };
}
