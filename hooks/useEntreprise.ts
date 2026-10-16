import { useState, useEffect } from 'react';

interface EntrepriseInfo {
  _id?: string;
  LogoE?: string;
  EnteteSociete?: string;
  PiedPageSociete?: string;
  NomSociete?: string;
  NCC?: string;
  travailleAvecApporteur?: boolean;
}

export const useEntreprise = () => {
  const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadEntreprise = async () => {
      try {
        const meRes = await fetch('/api/me', { cache: 'no-store' });
        if (!meRes.ok) return;
        const meData = await meRes.json();
        const myEntrepriseId = meData?.user?.entrepriseId;
        if (!myEntrepriseId) return;

        const res = await fetch(`/api/entreprise/${myEntrepriseId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data) {
          setEntreprise(data);
          localStorage.setItem('IdEntreprise', myEntrepriseId);
        }
      } catch (error) {
        console.error('Erreur chargement entreprise:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEntreprise();
    return () => {
      cancelled = true;
    };
  }, []);

  return { entreprise, loading };
};
