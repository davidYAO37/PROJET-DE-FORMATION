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
      <ParametreCRenduManager onParametreSelect={handleParametreSelect} />
    </Container>
  );
}
