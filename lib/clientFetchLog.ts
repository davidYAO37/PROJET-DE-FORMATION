"use client";

/**
 * Logue le résultat d'une réponse fetch non-ok en distinguant les 403 liés à
 * un blocage de licence (essai expiré, suspension, maintenance impayée) des
 * vraies erreurs inattendues.
 *
 * Les 403 de licence sont déjà signalés en continu par la bannière globale
 * `LicenceAlertBanner` : on les logue en `console.warn` (pas `console.error`)
 * pour ne pas déclencher l'overlay d'erreur de Next.js en dev, et les appelants
 * ne doivent pas afficher d'`alert()` redondant pour ce cas.
 */
export function logFetchIssue(status: number, context: string, detail?: unknown): void {
  if (status === 403) {
    console.warn(`${context} (accès refusé — licence bloquée ?)`, detail ?? "");
  } else {
    console.error(context, status, detail ?? "");
  }
}

/** Vrai si la réponse doit être traitée comme un blocage de licence (à ne pas alerter). */
export function isLicenceBlockedResponse(status: number): boolean {
  return status === 403;
}
