'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button } from 'react-bootstrap';

export default function Dashboard() {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem('profil');
    router.push('/connexion');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-4 text-primary">Bienvenue sur le Tableau de Bord service Accueil</h2>
        <Button variant="outline-danger" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </div>

      <Row className="g-4">
        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <Card.Title>Patients</Card.Title>
              <Card.Text>Gérez l'accueil, le transfert et la file d'attente des patients.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <Card.Title>Médecins</Card.Title>
              <Card.Text>Planifiez et suivez les disponibilités des médecins.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <Card.Title>Rendez-vous</Card.Title>
              <Card.Text>Contrôlez les créneaux et l'organisation des rendez-vous.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
