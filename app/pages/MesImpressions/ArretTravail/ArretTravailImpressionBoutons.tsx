'use client';

import { Button, ButtonGroup } from 'react-bootstrap';
import { FaFileAlt, FaPrint } from 'react-icons/fa';
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from '@/utils/printRecu';
import { buildArretTravailCertificatHtml } from '@/lib/arretTravail/certificatArretTemplates';
import type { ArretTravailPrintInput } from '@/lib/arretTravail/business';

/** Aligné sur `generatePrintHeader` / `useEntreprise`. */
interface EntreprisePrint {
  LogoE?: string;
  EnteteSociete?: string;
  PiedPageSociete?: string;
}

export interface ArretTravailImpressionBoutonsProps {
  arret: ArretTravailPrintInput;
  cliniqueNom: string;
  medecinDefaut: string;
  villeSignature?: string;
  entreprise: EntreprisePrint | null;
  titreFenetre?: string;
  size?: 'sm' | 'lg';
}

/**
 * Boutons « Imprimer avec en-tête » / « Sans en-tête » pour un certificat d’arrêt.
 */
export default function ArretTravailImpressionBoutons({
  arret,
  cliniqueNom,
  medecinDefaut,
  villeSignature,
  entreprise,
  titreFenetre = 'Certificat arrêt de travail',
  size = 'sm',
}: ArretTravailImpressionBoutonsProps) {
  const options = { cliniqueNom, medecinDefaut, villeSignature };
  const contentHTML = buildArretTravailCertificatHtml(arret, options);

  const printAvecEntete = () => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    createPrintWindow(titreFenetre, headerHTML, contentHTML, footerHTML);
  };

  const printSansEntete = () => {
    createPrintWindowWithoutHeader(titreFenetre, contentHTML);
  };

  return (
    <ButtonGroup size={size}>
      <Button variant="outline-success" title="Imprimer avec en-tête" onClick={printAvecEntete}>
        <FaPrint className="me-1" />
        Avec en-tête
      </Button>
      <Button variant="outline-secondary" title="Imprimer sans en-tête" onClick={printSansEntete}>
        <FaFileAlt className="me-1" />
        Sans en-tête
      </Button>
    </ButtonGroup>
  );
}
