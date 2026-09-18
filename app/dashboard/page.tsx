"use client";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { FaUsers, FaCalendarCheck, FaUserMd, FaSignOutAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import PlanningRdvMed from "@/components/PlanningRdvMed";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuthUser();
  const [stats, setStats] = useState({
    totalPatients: 0,
    rendezVousAujourdhui: 0,
    utilisateurConnecte: ""
  });
  const [loading, setLoading] = useState(true);

  // Charger les statistiques du tenant
  useEffect(() => {
    const chargerStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const utilisateurConnecte = userLoading
          ? ""
          : `${user?.nom || ''} ${user?.prenom || ''}`.trim() || localStorage.getItem('nom_utilisateur') || "";
        setStats({
          totalPatients: data.totalPatients || 0,
          rendezVousAujourdhui: data.rendezVousAujourdhui || 0,
          utilisateurConnecte
        });
      } catch (error) {
        console.error('Erreur de chargement des statistiques:', error);
        const utilisateurConnecte = userLoading
          ? ""
          : `${user?.nom || ''} ${user?.prenom || ''}`.trim() || localStorage.getItem('nom_utilisateur') || "";
        setStats(prev => ({
          ...prev,
          utilisateurConnecte
        }));
      } finally {
        setLoading(false);
      }
    };

    chargerStats();
  }, [user, userLoading]);

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
    // Supprime le token ou les infos de session stockées
    localStorage.removeItem('profil'); // selon ton système
    localStorage.removeItem('nom_utilisateur'); // selon ton système
    localStorage.removeItem('IdEntreprise'); // selon ton système
    // Redirige vers la page de connexion
    router.push('/connexion');
  };

  return (
    <>
      <style>{cardStyles}</style>
    
      <div className="d-flex flex-column flex-md-row min-vh-100">
        {/* Contenu principal */}
        <div className="flex-grow-1 bg-light">
         <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="mb-0 text-primary fw-bold">
                <FaUserMd className="me-2" />
                Tableau de bord {user?.type === 'admin' || user?.type === 'adminsuper' ? 'Administrateur' : 'Utilisateur'}
              </h2>
              <Button variant="outline-danger" onClick={handleLogout}>
                <FaSignOutAlt className="me-1" />
                Se déconnecter
              </Button>
            </div>

            <Row className="g-4 my-1">
              <Col md={4}>
                <Card className="shadow h-75 border-0 my-3" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  transition: 'transform 0.3s ease'
                }}>
                  <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                    <div className="mb-3">
                      <FaUsers size={48} className="mb-3" />
                    </div>
                    <Card.Title className="text-white mb-2">Patients</Card.Title>
                    <div>
                      <Badge bg="light" text="dark" className="fs-6">
                        {stats.totalPatients}
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
                      <FaCalendarCheck size={48} className="mb-3" />
                    </div>
                    <Card.Title className="text-white mb-2">Rendez-vous</Card.Title>
                    <div>
                      <Badge bg="light" text="dark" className="fs-6">
                        {stats.rendezVousAujourdhui}
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
                      <FaUserMd size={48} className="mb-3" />
                    </div>
                    <Card.Title className="text-white mb-2"></Card.Title>
                    <div>
                      <Badge bg="light" text="dark" className="fs-6" style={{ fontSize: '1.2rem !important', padding: '0.5rem 1rem !important' }}>
                        {loading || userLoading ? 'Chargement...' : (stats.utilisateurConnecte || 'Utilisateur')}
                      </Badge>
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
          </Container>
        </div>
      </div>
    </>
  );
}
