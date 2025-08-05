'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Medecins from './parametres/medecin/page';

export default function DashboardPage() {
  const router = useRouter();
  const handleLogout = () => {
    // Supprime le token ou les infos de session stockées
    localStorage.removeItem('profil'); // selon ton système
    // Redirige vers la page de connexion
    router.push('/connexion');
  };

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">


      {/* Contenu principal */}

      <div className="flex-grow-1 bg-light">
        <Container className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="text-primary">Tableau de bord Administrateur</h1>
            <Button variant="outline-danger" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>Patients</Card.Title>
                  <Card.Text>258 enregistrés</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>Rendez-vous</Card.Title>
                  <Card.Text>12 aujourd'hui</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>Utilisateur connecté</Card.Title>
                  <Card.Text>Dr. KOUASSI David</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}
