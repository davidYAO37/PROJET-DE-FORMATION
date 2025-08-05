// app/page.tsx
'use client';

import { Card, Row, Col } from 'react-bootstrap';

export default function Caisse() {
  return (
    <div>
      <h2 className="mb-4 text-primary">Bienvenue sur le Tableau de Bord</h2>

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
