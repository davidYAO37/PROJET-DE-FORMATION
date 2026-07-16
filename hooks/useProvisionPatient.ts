import { useEffect, useState } from 'react';

export function useProvisionPatient(patientId?: string, initialProvision?: number) {
  const [provision, setProvision] = useState<number | undefined>(initialProvision);

  useEffect(() => {
    if (initialProvision !== undefined) return;

    if (!patientId) {
      setProvision(undefined);
      return;
    }

    let cancelled = false;

    fetch(`/api/patients/${patientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setProvision(Number(data?.ProvisionClient) || 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Erreur lors de la récupération de la provision du patient:', err);
          setProvision(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, initialProvision]);

  return provision;
}

export function isCautionMode(mode: string | undefined) {
  return typeof mode === 'string' && mode.trim().toLowerCase() === 'caution';
}

export function isCautionAvailable(provision: number | undefined, amountToPay: number) {
  return typeof provision === 'number' && provision > 0 && amountToPay > 0 && amountToPay <= provision;
}
