'use client';

import { FaHospital, FaBed, FaUserInjured } from 'react-icons/fa';
import { Button, Card, Col, Row, Container } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PatientsHospitalises from '../components/PatientsHospitalises';

export default function PagePatientsHospitalises() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ litsOccupes: 0, patientsActifs: 0, surveillance: 0 });

  const infirmierConnecte = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur')
    : null;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/examenhospitalisation/hospitalises');
        if (res.ok) {
          const data = await res.json();
          const hospits = Array.isArray(data) ? data : [];
          const litsOccupes = new Set(hospits.map((h: any) => h.Chambre).filter(Boolean)).size;
          const patientsActifs = hospits.length;
          const surveillance = hospits.filter((h: any) => (h.nombreDeJours || 0) > 7).length;
          setStats({ litsOccupes, patientsActifs, surveillance });
        }
      } catch (error) {
        console.error('Erreur stats hospitalisation:', error);
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

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold" style={{ color: '#0dcaf0' }}>
          <FaHospital className="me-2" />
          Patients Hospitalisés - {infirmierConnecte}
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
              background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
              color: 'white',
            }}
          >
            <Card.Body className="d-flex flex-column align-items-center py-4">
              <FaBed size={42} className="mb-2" />
              <Card.Title className="text-white mb-2">Lits occupés</Card.Title>
              <div className="fs-4 fw-bold">{loading ? '...' : stats.litsOccupes}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card
            className="shadow border-0"
            style={{
              background: 'linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%)',
              color: 'white',
            }}
          >
            <Card.Body className="d-flex flex-column align-items-center py-4">
              <FaUserInjured size={42} className="mb-2" />
              <Card.Title className="text-white mb-2">Patients actifs</Card.Title>
              <div className="fs-4 fw-bold">{loading ? '...' : stats.patientsActifs}</div>
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
              <FaHospital size={42} className="mb-2" />
              <Card.Title className="text-white mb-2">Surveillance</Card.Title>
              <div className="fs-4 fw-bold">{loading ? '...' : stats.surveillance}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <PatientsHospitalises />
    </Container>
  );
}
