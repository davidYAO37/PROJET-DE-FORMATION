'use client';

import { FaClock, FaHeartbeat, FaUserNurse, FaClipboardList } from 'react-icons/fa';
import ListePatientsInfirmier from './components/ListePatientsInfirmier';
import { Badge, Button, Card, Col, Row } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Statistiques {
  patientsEnCharge: number;
  constantesDuJour: number;
  observationsDuJour: number;
}

export default function PageInfirmier() {
  const router = useRouter();
  const [statistiques, setStatistiques] = useState<Statistiques>({
    patientsEnCharge:   0,
    constantesDuJour:   0,
    observationsDuJour: 0,
  });
  const [loading, setLoading] = useState(true);

  const infirmierConnecte = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur')
    : null;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, obsRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/observations'),
        ]);

        const patients     = patientsRes.ok ? await patientsRes.json() : [];
        const observations = obsRes.ok      ? await obsRes.json()      : [];

        const today = new Date().toDateString();
        const obsDuJour = observations.filter((o: any) => {
          const d = new Date(o.createdAt || o.Date);
          return d.toDateString() === today;
        });

        setStatistiques({
          patientsEnCharge:   patients.length,
          constantesDuJour:   obsDuJour.length,
          observationsDuJour: observations.length,
        });
      } catch (error) {
        console.error('Erreur statistiques infirmier:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('profil');
    localStorage.removeItem('nom_utilisateur');
    localStorage.removeItem('IdEntreprise');
    router.push('/connexion');
  };

  const cardStyles = `
    .card-stat:hover {
      transform: translateY(-5px) !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
    }
  `;

  return (
    <>
      <style>{cardStyles}</style>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 fw-bold" style={{ color: '#0dcaf0' }}>
            <FaUserNurse className="me-2" />
            {infirmierConnecte} — Tableau de bord Infirmier
          </h2>
          <Button variant="outline-danger" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </div>

        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card
              className="shadow border-0 card-stat"
              style={{
                background: 'linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%)',
                color: 'white',
                transition: 'transform 0.3s ease',
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center py-4">
                <FaUserNurse size={42} className="mb-2" />
                <Card.Title className="text-white mb-2">Patients en charge</Card.Title>
                <Badge bg="light" text="dark" className="fs-5 px-4 py-2">
                  {loading ? '...' : statistiques.patientsEnCharge}
                </Badge>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              className="shadow border-0 card-stat"
              style={{
                background: 'linear-gradient(135deg, #20c997 0%, #198754 100%)',
                color: 'white',
                transition: 'transform 0.3s ease',
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center py-4">
                <FaHeartbeat size={42} className="mb-2" />
                <Card.Title className="text-white mb-2">Constantes saisies aujourd'hui</Card.Title>
                <Badge bg="light" text="dark" className="fs-5 px-4 py-2">
                  {loading ? '...' : statistiques.constantesDuJour}
                </Badge>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              className="shadow border-0 card-stat"
              style={{
                background: 'linear-gradient(135deg, #fd7e14 0%, #dc3545 100%)',
                color: 'white',
                transition: 'transform 0.3s ease',
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center py-4">
                <FaClipboardList size={42} className="mb-2" />
                <Card.Title className="text-white mb-2">Total observations</Card.Title>
                <Badge bg="light" text="dark" className="fs-5 px-4 py-2">
                  {loading ? '...' : statistiques.observationsDuJour}
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      <div>
        <ListePatientsInfirmier />
      </div>
    </>
  );
}
