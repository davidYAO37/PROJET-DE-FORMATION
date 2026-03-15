import React from "react";
import { useEntreprises } from "@/hooks/useEntreprises";

interface EntrepriseSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}

const EntrepriseSelect: React.FC<EntrepriseSelectProps> = ({ value, onChange, required = false }) => {
  const { entreprises, loading, error } = useEntreprises();

  return (
    <select 
      className="form-select mb-3" 
      name="entrepriseId" 
      value={value} 
      onChange={onChange} 
      required={required}
    >
      <option value="">Sélectionnez une entreprise</option>
      {loading ? (
        <option value="" disabled>Chargement des entreprises...</option>
      ) : error ? (
        <option value="" disabled>Erreur: {error}</option>
      ) : entreprises.length === 0 ? (
        <option value="" disabled>Aucune entreprise disponible</option>
      ) : (
        entreprises.map((entreprise) => (
          <option key={entreprise._id} value={entreprise._id}>
            {entreprise.NomSociete || `Entreprise ${entreprise._id}`}
          </option>
        ))
      )}
    </select>
  );
};

export default EntrepriseSelect;
