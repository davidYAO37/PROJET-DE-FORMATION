"use client";
import { Container } from "react-bootstrap";
import { FaClock } from "react-icons/fa";
import ParametreCRenduManager from "@/app/dashboard/parametres/parametreCRendu/ParametreCRenduManager";
import { IParametreCRendu } from "@/models/ParametreCRendu";

export default function ParametresPage() {
  const handleParametreSelect = (parametre: IParametreCRendu) => {
    console.log("Paramètre sélectionné:", parametre);
    // Vous pouvez ajouter ici la logique pour afficher les détails ou ouvrir une modal
  };

  return (
    <Container fluid className="p-4">
      <div className="mb-4">
        <h2 className="mb-3">
          <FaClock className="me-2" />
          Paramètres des Comptes Rendus
        </h2>
        <p className="text-muted">
          Gérez les paramètres des comptes rendus radio (lettres clés, dates, etc.)
        </p>
      </div>
      
      <ParametreCRenduManager onParametreSelect={handleParametreSelect} />
    </Container>
  );
}
