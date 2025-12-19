'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalConsultations: 0, waitingRoomCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/consultation/date');
        if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Rafraîchir les données toutes les minutes
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('profil');
    router.push('/connexion');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-4 text-primary">Tableau de Bord - Service Accueil</h2>
        <Button variant="outline-danger" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </div>

      <Row className="g-4">
        <Col md={4}>
          <Card className="shadow h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="d-flex justify-content-between align-items-center">
               <Card.Text>Patients reçus du jour</Card.Text>
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <span className="badge bg-primary rounded-pill fs-2">
                    {stats.totalConsultations}
                  </span>
                )}
              </Card.Title>
              
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="shadow h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="d-flex justify-content-between align-items-center">
                 <Card.Text>Patients en attente de prise de constante</Card.Text>
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <span className="badge bg-warning rounded-pill fs-2">
                    {stats.waitingRoomCount}
                  </span>
                )}
              </Card.Title>
             
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="d-flex justify-content-between align-items-center">
                 <Card.Text>Nombre de rendez-vous du jour</Card.Text>
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <span className="badge bg-success  rounded-pill fs-2">
                    {stats.waitingRoomCount}
                  </span>
                )}
              </Card.Title>
             
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
