"use client";
import { useState } from "react";
import { Container, Button, Alert, Row, Col, Card } from "react-bootstrap";
import { FaPlus, FaList, FaDatabase } from "react-icons/fa";
import ParametreCRenduManager from "@/app/dashboard/parametres/parametreCRendu/ParametreCRenduManager";
import { IParametreCRendu } from "@/models/ParametreCRendu";

export default function TestParametreCRenduPage() {
  const [selectedParametre, setSelectedParametre] = useState<IParametreCRendu | null>(null);
  const [showManager, setShowManager] = useState(true);

  const handleParametreSelect = (parametre: IParametreCRendu) => {
    setSelectedParametre(parametre);
  };

  return (
    <Container fluid className="p-4">
      <div className="mb-4">
        <h2 className="mb-3">
          <FaDatabase className="me-2" />
          Test CRUD - Paramètres de Compte Rendu
        </h2>
        <p className="text-muted">
          Page de test pour les opérations CRUD sur les paramètres de compte rendu
        </p>
      </div>

      <Row className="mb-4">
        <Col>
          <Button 
            variant={showManager ? "primary" : "outline-primary"}
            onClick={() => setShowManager(true)}
            className="me-2"
          >
            <FaList className="me-2" />
            Gestion des Paramètres
          </Button>
          <Button 
            variant="success"
            onClick={() => setShowManager(false)}
            className="me-2"
          >
            <FaPlus className="me-2" />
            Ajouter un Paramètre
          </Button>
        </Col>
      </Row>

      {selectedParametre && (
        <Alert variant="info" className="mb-4">
          <strong>Paramètre sélectionné:</strong> {selectedParametre.LettreCle} - 
          Ajouté par {selectedParametre.AjouterPar} le {new Date(selectedParametre.Date).toLocaleDateString('fr-FR')}
        </Alert>
      )}

      {showManager ? (
        <Card>
          <Card.Header>
            <h5><FaList className="me-2" />Gestion des Paramètres</h5>
          </Card.Header>
          <Card.Body>
            <ParametreCRenduManager onParametreSelect={handleParametreSelect} />
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <h5><FaPlus className="me-2" />Ajout Rapide</h5>
          </Card.Header>
          <Card.Body>
            <p className="text-muted">
              Cliquez sur le bouton "Ajouter un Paramètre" dans le gestionnaire pour ajouter un nouveau paramètre.
            </p>
            <Button variant="primary" onClick={() => setShowManager(true)}>
              <FaList className="me-2" />
              Ouvrir le Gestionnaire
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
