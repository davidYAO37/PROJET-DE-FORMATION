// app/page.tsx
'use client';

import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaUserCheck, FaFlask, FaFileInvoice, FaClock, FaSignOutAlt } from 'react-icons/fa';
import Page from '../patientcaisse/page';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Caisse() {
  const router = useRouter();
  const [consultations, setConsultations] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [facturesNonSoldées, setFacturesNonSoldées] = useState([]);

  // Charger les données pour les compteurs
  useEffect(() => {
    const chargerDonnées = async () => {
      try {
        // Charger les consultations
        const consultationsResponse = await fetch('/api/consultations');
        if (consultationsResponse.ok) {
          const consultationsData = await consultationsResponse.json();
          setConsultations(consultationsData.data || []);
        }

        // Charger les prestations
        const prestationsResponse = await fetch('/api/prestations');
        if (prestationsResponse.ok) {
          const prestationsData = await prestationsResponse.json();
          setPrestations(prestationsData.data || []);
        }

        // Charger les prescriptions
        const prescriptionsResponse = await fetch('/api/prescriptions');
        if (prescriptionsResponse.ok) {
          const prescriptionsData = await prescriptionsResponse.json();
          setPrescriptions(prescriptionsData.data || []);
        }

        // Charger les factures non soldées
        const facturesResponse = await fetch('/api/factures-non-soldees');
        if (facturesResponse.ok) {
          const facturesData = await facturesResponse.json();
          setFacturesNonSoldées(facturesData.data || []);
        }
      } catch (error) {
        console.error('Erreur de chargement:', error);
      }
    };

    chargerDonnées();
  }, []);

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

 const handleLogout = () => {
    localStorage.removeItem('profil');
    localStorage.removeItem('nom_utilisateur');
    localStorage.removeItem('IdEntreprise');
    router.push('/connexion');
  };
  
  return (
    <>
      <style>{cardStyles}</style>
    
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 text-primary fw-bold">
            <FaClock className="me-2" />
            Tableau de Bord
          </h2>
          <Button variant="outline-danger" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </div>
        <Row className="g-4 my-4">
          <Col md={4}>
            <Card className="shadow h-75 border-0 my-3" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}>
              <Card.Body className=" d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaUserCheck size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Consultations <br /> à facturer</Card.Title>
                <div>
                  <Badge bg="light" text="dark" className="fs-6">
                    {consultations.length}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow h-75 border-0 my-3" style={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}>
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaFlask size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Examens-Pharmacies et Autres</Card.Title>
                <div>
                  <Badge bg="light" text="dark" className="fs-6">
                    {prestations.length + prescriptions.length}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow h-75 border-0 my-3" style={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}>
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaFileInvoice size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Factures à solder</Card.Title>
                <div>
                  <Badge bg="light" text="dark" className="fs-6">
                    {facturesNonSoldées.length}
                  </Badge>
                </div>
                
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
      <div>
        <Page />
      </div>
    </>
  );
}
