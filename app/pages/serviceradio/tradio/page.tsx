"use client";
import { useState } from "react";
import { Tabs, Tab, Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaUsers, FaClock, FaEdit, FaCheckCircle } from "react-icons/fa";
import ListePatientRadio from "./composants/ListePatientRadio";
import ListeAvalider from "./composants/ListeAvalider";
import ListesValides from "./composants/ListesValides";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";
import { useRouter } from 'next/navigation';

export default function TRadioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("patients");
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [selectedLigne, setSelectedLigne] = useState<ILignePrestation | null>(null);

  const handlePatientSelect = (patient: IPatient) => {
    setSelectedPatient(patient);
  };

  const handleLigneSelect = (ligne: ILignePrestation, patient: IPatient) => {
    setSelectedLigne(ligne);
    setSelectedPatient(patient);
    // Ici vous pourriez ouvrir une modal pour saisir le résultat
    console.log("Sélection de la ligne pour saisie:", ligne);
  };

  // medecin connecté
  const medecinConnecte = localStorage.getItem('nom_utilisateur');
  const handleLogout = () => {
    localStorage.removeItem('profil');
    localStorage.removeItem('nom_utilisateur');
    localStorage.removeItem('IdEntreprise');
    router.push('/connexion');
  };

  return (
    <Container fluid className="p-4">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 text-primary fw-bold">
            <FaClock className="me-2" />
            {medecinConnecte} - Bienvenue sur votre tableau de bord
          </h2>
          <Button variant="outline-danger" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </div>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "patients")}
          className="mb-4"
        >
          <Tab 
            eventKey="patients" 
            title={
              <span>
                <FaUsers className="me-2" />
                Liste des Patients
              </span>
            }
          >
            <Card>
              <Card.Body>
                <ListePatientRadio onPatientSelect={handlePatientSelect} />
              </Card.Body>
            </Card>
          </Tab>

          <Tab 
            eventKey="avalider" 
            title={
              <span>
                <FaClock className="me-2" />
                Compte Rendu à Saisir/Valider
              </span>
            }
          >
            <Card>
              <Card.Body>
                <ListeAvalider onLigneSelect={handleLigneSelect} />
              </Card.Body>
            </Card>
          </Tab>

          <Tab 
            eventKey="valides" 
            title={
              <span>
                <FaCheckCircle className="me-2" />
                Compte Rendus Validés
              </span>
            }
          >
            <Card>
              <Card.Body>
                <ListesValides onLigneSelect={handleLigneSelect} />
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </div>       
    </Container>
  );
}