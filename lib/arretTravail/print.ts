import type { ArretTravailPrintInput } from '@/lib/arretTravail/business';
import {
  buildArretTravailCertificatHtml,
  type CertificatArretHtmlOptions,
} from '@/lib/arretTravail/certificatArretTemplates';

export interface BuildArretTravailPrintHtmlOptions {
  cliniqueNom: string;
  medecinDefaut: string;
  villeSignature?: string;
}

/**
 * HTML d’impression arrêt de travail (certificat selon le type — textes officiels).
 */
export function buildArretTravailPrintHtml(
  arret: ArretTravailPrintInput,
  options: BuildArretTravailPrintHtmlOptions
): string {
  const opts: CertificatArretHtmlOptions = {
    cliniqueNom: options.cliniqueNom,
    medecinDefaut: options.medecinDefaut,
    villeSignature: options.villeSignature,
  };
  return buildArretTravailCertificatHtml(arret, opts);
}
