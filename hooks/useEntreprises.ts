import { useState, useEffect } from "react";

interface Entreprise {
  _id: string;
  NomSociete?: string;
  EnteteSociete?: string;
  LogoE?: string;
  PiedPageSociete?: string;
  NCC?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useEntreprises = () => {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntreprises = async () => {
      try {
        const response = await fetch("/api/entreprise");
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des entreprises");
        }
        const data = await response.json();
        setEntreprises(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchEntreprises();
  }, []);

  return { entreprises, loading, error };
};
