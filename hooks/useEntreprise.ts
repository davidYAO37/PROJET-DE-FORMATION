import { useState, useEffect } from 'react';

interface EntrepriseInfo {
  LogoE?: string;
  EnteteSociete?: string;
  PiedPageSociete?: string;
  NomSociete?: string;
  NCC?: string;
}

export const useEntreprise = () => {
  const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadEntreprise = async () => {
      try {
        // Récupérer l'IdEntreprise depuis le localStorage
        if (typeof window !== 'undefined') {
          const idEntreprise = localStorage.getItem('IdEntreprise');
          if (idEntreprise) {
            try {
              // Charger les données de l'entreprise depuis l'API avec l'ID
              const res = await fetch(`/api/entreprise/${idEntreprise}`);
              if (res.ok) {
                const data = await res.json();
                if (!cancelled && data) {
                  setEntreprise(data);
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.error('Erreur chargement entreprise par ID:', e);
            }
          }
        }

        // Si pas d'IdEntreprise en localStorage, récupérer celui de l'utilisateur connecté
        const meRes = await fetch('/api/me');
        if (!meRes.ok) return;
        const meData = await meRes.json();
        const myEntrepriseId = meData?.user?.entrepriseId;
        if (!myEntrepriseId) return;

        const res = await fetch(`/api/entreprise/${myEntrepriseId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data) {
          setEntreprise(data);

          // Sauvegarder l'ID dans localStorage pour les prochaines fois
          if (typeof window !== 'undefined') {
            localStorage.setItem('IdEntreprise', myEntrepriseId);
          }
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
