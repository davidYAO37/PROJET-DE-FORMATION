"use client";
import { useState, useEffect } from "react";
import { Tabs, Tab, Container, Row, Col, Card, Button, Badge, Spinner } from "react-bootstrap";
import { FaUsers, FaClock, FaEdit, FaCheckCircle, FaSyncAlt, FaSignOutAlt, FaCalendarAlt, FaHourglassHalf, FaFileMedical } from "react-icons/fa";
import ListePatientRadio from "./components/ListePatientRadio";
import ListeAvalider from "./components/ListeAvalider";
import ListesValides from "./components/ListesValides";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";
import { useRouter } from 'next/navigation';
import LicenceModuleGuard from "@/components/licence/LicenceModuleGuard";
import styles from './tradio.module.css';

interface RadioStats {
  aSaisir: number;
  enAttente: number;
  valides: number;
  totalPatients: number;
  total: number;
}

export default function TRadioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("patients");
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [selectedLigne, setSelectedLigne] = useState<ILignePrestation | null>(null);
  const [stats, setStats] = useState<RadioStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/compteRenduRadio/stats');
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handlePatientSelect = (patient: IPatient) => {
    setSelectedPatient(patient);
  };

  const handleLigneSelect = (ligne: ILignePrestation, patient: IPatient) => {
    setSelectedLigne(ligne);
    setSelectedPatient(patient);
  };

  const medecinConnecte = typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') : '';
  const handleLogout = () => {
    localStorage.removeItem('profil');
    localStorage.removeItem('nom_utilisateur');
    localStorage.removeItem('IdEntreprise');
    router.push('/connexion');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (activeTab) {
      window.dispatchEvent(new CustomEvent('refreshTabData', { 
        detail: { activeTab } 
      }));
    }
  }, [activeTab]);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const kpiCards = [
    {
      key: 'patients',
      title: 'Patients radio',
      value: stats?.totalPatients ?? 0,
      icon: <FaUsers size={28} />,
      color: '#0d6efd',
      bg: 'rgba(13, 110, 253, 0.08)',
      border: 'rgba(13, 110, 253, 0.2)'
    },
    {
      key: 'asaisir',
      title: 'À saisir',
      value: stats?.aSaisir ?? 0,
      icon: <FaEdit size={28} />,
      color: '#dc3545',
      bg: 'rgba(220, 53, 69, 0.08)',
      border: 'rgba(220, 53, 69, 0.2)'
    },
    {
      key: 'attente',
      title: 'En attente de validation',
      value: stats?.enAttente ?? 0,
      icon: <FaHourglassHalf size={28} />,
      color: '#fd7e14',
      bg: 'rgba(253, 126, 20, 0.08)',
      border: 'rgba(253, 126, 20, 0.2)'
    },
    {
      key: 'valides',
      title: 'Comptes rendus validés',
      value: stats?.valides ?? 0,
      icon: <FaCheckCircle size={28} />,
      color: '#198754',
      bg: 'rgba(25, 135, 84, 0.08)',
      border: 'rgba(25, 135, 84, 0.2)'
    }
  ];

  return (
    <LicenceModuleGuard module="radio">
      <Container fluid className={`p-4 ${styles.tradioPage}`}>
        <Card className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)' }}>
          <Card.Body className="text-white py-4">
            <Row className="align-items-center">
              <Col xs={12} md={8}>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="bg-white bg-opacity-25 rounded-circle p-3">
                    <FaFileMedical size={32} />
                  </div>
                  <div>
                    <h2 className="mb-0 fw-bold">Tableau de bord — Service Radio</h2>
                    <p className="mb-0 opacity-75">
                      <FaCalendarAlt className="me-2" />
                      {today}
                    </p>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                <div className="d-flex gap-2 justify-content-md-end">
                  <Button variant="light" onClick={handleRefresh} title="Rafraîchir" className="d-flex align-items-center">
                    <FaSyncAlt className="me-2" />
                    Rafraîchir
                  </Button>
                  <Button variant="outline-light" onClick={handleLogout} className="d-flex align-items-center">
                    <FaSignOutAlt className="me-2" />
                    Déconnexion
                  </Button>
                </div>
                {medecinConnecte && (
                  <small className="d-block mt-2 opacity-75">
                    Connecté en tant que <strong>{medecinConnecte}</strong>
                  </small>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row className="g-3 mb-4">
          {kpiCards.map((kpi) => (
            <Col key={kpi.key} xs={12} sm={6} xl={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ borderLeft: `4px solid ${kpi.color} !important` }}>
                <Card.Body className="d-flex align-items-center p-3" style={{ backgroundColor: kpi.bg }}>
                  <div className="me-3" style={{ color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <h6 className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{kpi.title}</h6>
                    <h3 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>
                      {loadingStats ? <Spinner size="sm" /> : kpi.value}
                    </h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || "patients")}
              className={`mb-0 ${styles.radioTabs}`}
              variant="pills"
            >
              <Tab 
                eventKey="patients" 
                title={
                  <span>
                    <FaUsers className="me-2" />
                    Liste des Patients
                    {stats && stats.totalPatients > 0 && (
                      <Badge bg="primary" className="ms-2">{stats.totalPatients}</Badge>
                    )}
                  </span>
                }
              >
                <div className="p-3">
                  <ListePatientRadio onPatientSelect={handlePatientSelect} />
                </div>
              </Tab>

              <Tab 
                eventKey="avalider" 
                title={
                  <span>
                    <FaClock className="me-2" />
                    À Saisir/Valider
                    {stats && (stats.aSaisir + stats.enAttente) > 0 && (
                      <Badge bg="warning" text="dark" className="ms-2">{stats.aSaisir + stats.enAttente}</Badge>
                    )}
                  </span>
                }
              >
                <div className="p-3">
                  <ListeAvalider onLigneSelect={handleLigneSelect} />
                </div>
              </Tab>

              <Tab 
                eventKey="valides" 
                title={
                  <span>
                    <FaCheckCircle className="me-2" />
                    Comptes Rendus Validés
                    {stats && stats.valides > 0 && (
                      <Badge bg="success" className="ms-2">{stats.valides}</Badge>
                    )}
                  </span>
                }
              >
                <div className="p-3">
                  <ListesValides onLigneSelect={handleLigneSelect} />
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>
    </LicenceModuleGuard>
  );
}
