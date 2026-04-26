"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Spinner, Badge } from 'react-bootstrap';
import { FaUserCheck, FaClock, FaCalendarCheck, FaSignOutAlt } from 'react-icons/fa';
import PlanningRdvMed from '@/components/PlanningRdvMed';

// Interface pour les rendez-vous
interface RendezVous {
  id?: string;
  date: string;
  heure?: string;
  patientNom?: string;
  medecinNom?: string;
  description?: string;
  statut?: 'confirmé' | 'en attente' | 'annulé' | string;
}

export default function TpatientPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalConsultations: 0, waitingRoomCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour le planning - plus besoin d'entrepriseId

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/connexion');
  };

  // Styles CSS pour les cartes
  const cardStyles = `
    .card:hover {
      transform: translateY(-5px) !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
    }
    .badge {
      font-size: 1.5rem !important;
      padding: 0.75rem 1.5rem !important;
      border-radius: 2rem !important;
      margin: 0 1rem !important;
      min-width: 80px !important;
      text-align: center !important;
    }
  `;

  return (
    <>
      <style>{cardStyles}</style>
    {/* Section Tableau de Bord */}
      <div className="container-fluid py-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="mb-0 text-primary fw-bold">
            <FaUserCheck className="me-2" />
            Tableau de Bord - Service Accueil
          </h2>
          <Button variant="outline-danger" onClick={handleLogout}>
            <FaSignOutAlt className="me-1" />
            Se déconnecter
          </Button>
        </div>
{/* Section informations */}
        <Row className="g-4 my-1">
        <Col md={4}>
          <Card className="shadow h-75 border-0 my-2" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            transition: 'transform 0.3s ease'
          }}>
            <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
              <div className="mb-3">
                <FaUserCheck size={48} className="mb-3" />
              </div>
              <Card.Title className="text-white mb-2">Patients reçus du jour</Card.Title>
              <div>
                {loading ? (
                  <Spinner animation="border" variant="light" />
                ) : (
                  <Badge bg="light" text="dark" className="fs-6">
                    {stats.totalConsultations}
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="shadow h-75 border-0 my-2" style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            transition: 'transform 0.3s ease'
          }}>
            <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
              <div className="mb-3">
                <FaClock size={48} className="mb-3" />
              </div>
              <Card.Title className="text-white mb-2">Patients en attente</Card.Title>
              <div>
                {loading ? (
                  <Spinner animation="border" variant="light" />
                ) : (
                  <Badge bg="light" text="dark" className="fs-6">
                    {stats.waitingRoomCount}
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow h-75 border-0 my-2" style={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            transition: 'transform 0.3s ease'
          }}>
            <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
              <div className="mb-3">
                <FaCalendarCheck size={48} className="mb-3" />
              </div>
              <Card.Title className="text-white mb-2">Rendez-vous du jour</Card.Title>
              <div>
                {loading ? (
                  <Spinner animation="border" variant="light" />
                ) : (
                  <Badge bg="light" text="dark" className="fs-6">
                    {stats.waitingRoomCount}
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Section Planning des Rendez-vous */}
      <Row className="g-4 my-1">
        <Col md={12}>
          <PlanningRdvMed />
        </Col>
      </Row>
    </div>
    </>
  );
}
