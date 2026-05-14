'use client';

import { useMemo } from 'react';
import { buildArretTravailCertificatHtml } from '@/lib/arretTravail/certificatArretTemplates';
import type { ArretTravailPrintInput } from '@/lib/arretTravail/business';

export interface ArretTravailCertificatApercuProps {
  arret: ArretTravailPrintInput;
  cliniqueNom: string;
  medecinDefaut: string;
  villeSignature?: string;
  /** Hauteur minimale de la zone d’aperçu */
  minHeight?: number;
}

/**
 * Aperçu HTML du certificat d’arrêt (même rendu que l’impression).
 */
export default function ArretTravailCertificatApercu({
  arret,
  cliniqueNom,
  medecinDefaut,
  villeSignature,
  minHeight = 360,
}: ArretTravailCertificatApercuProps) {
  const html = useMemo(
    () =>
      buildArretTravailCertificatHtml(arret, {
        cliniqueNom,
        medecinDefaut,
        villeSignature,
      }),
    [arret, cliniqueNom, medecinDefaut, villeSignature]
  );

  return (
    <iframe
      title="Aperçu certificat arrêt de travail"
      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;background:#fff;}</style></head><body>${html}</body></html>`}
      className="w-100 rounded border bg-white"
      style={{ minHeight, borderColor: '#dee2e6' }}
    />
  );
}
