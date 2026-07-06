'use client';

import { FaPills, FaClock, FaCheckCircle } from 'react-icons/fa';
import { Button, Card, Col, Row, Container } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PrescriptionsAExecuter from '../components/PrescriptionsAExecuter';

export default function PagePrescriptions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const infirmierConnecte = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur')
    : null;

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('profil');
    localStorage.removeItem('nom_utilisateur');
    localStorage.removeItem('IdEntreprise');
    router.push('/connexion');
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold" style={{ color: '#0dcaf0' }}>
          <FaPills className="me-2" />
          Prescriptions à Exécuter - {infirmierConnecte}
        </h2>
        <Button variant="outline-danger" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </div>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card
            className="shadow border-0"
            style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
              color: 'white',
            }}
          >
            <Card.Body className="d-flex flex-column align-items-center py-4">
              <FaClock size={42} className="mb-2" />
              <Card.Title className="text-white mb-2">En attente</Card.Title>
              <div className="fs-4 fw-bold">--</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card
            className="shadow border-0"
            style={{
              background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
              color: 'white',
            }}
          >
            <Card.Body className="d-flex flex-column align-items-center py-4">
              <FaPills size={42} className="mb-2" />
              <Card.Title className="text-white mb-2">En cours</Card.Title>
              <div className="fs-4 fw-bold">--</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card
            className="shadow border-0"
            style={{
              background: 'linear-gradient(135deg, #20c997 0%, #198754 100%)',
              color: 'white',
            }}
          >
            <Card.Body className="d-flex flex-column align-items-center py-4">
              <FaCheckCircle size={42} className="mb-2" />
              <Card.Title className="text-white mb-2">Complétées</Card.Title>
              <div className="fs-4 fw-bold">--</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <PrescriptionsAExecuter />
    </Container>
  );
}
