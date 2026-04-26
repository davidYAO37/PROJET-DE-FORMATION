'use client';
import { FaClock, FaFileInvoice, FaFlask, FaUserCheck } from 'react-icons/fa';
import ListePatientsMedecin from './composants/ListePatientsMedecin';
import { Badge, Button, Card, Col, Row } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Statistiques {
  patientsRecus: number;
  patientsEnAttente: number;
  rendezVousDuJour: number;
}

export default function Page() {
 const router = useRouter();
 const [statistiques, setStatistiques] = useState<Statistiques>({
  patientsRecus: 0,
  patientsEnAttente: 0,
  rendezVousDuJour: 0
 });
 const [loading, setLoading] = useState(true);

 // Récupérer l'ID du médecin connecté
 useEffect(() => {
  const fetchStatistiques = async () => {
    try {
      const profilStr = localStorage.getItem('profil');
      
      if (profilStr) {
        const profil = JSON.parse(profilStr);
        
        // Récupérer tous les médecins pour trouver le médecin connecté
        const medecinsResponse = await fetch('/api/medecins');
        if (medecinsResponse.ok) {
          const allMedecins = await medecinsResponse.json();
          const connectedMedecin = allMedecins.find((medecin: any) => 
            medecin._id.toString() === profil._id ||
            (medecin.nom === profil.nom && medecin.prenoms === profil.prenom)
          );
          
          if (connectedMedecin) {
            // Récupérer les statistiques des consultations
            const consultationsResponse = await fetch(`/api/consultations/statistiques?medecinId=${connectedMedecin._id}`);
            const consultationsData = await consultationsResponse.json();
            
            // Récupérer les statistiques des rendez-vous
            const rendezVousResponse = await fetch(`/api/rendez-vous/statistiques?medecinId=${connectedMedecin._id}`);
            const rendezVousData = await rendezVousResponse.json();
            
            setStatistiques({
              patientsRecus: consultationsData.patientsRecus || 0,
              patientsEnAttente: consultationsData.patientsEnAttente || 0,
              rendezVousDuJour: rendezVousData.rendezVousDuJour || 0
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchStatistiques();
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
// medecin connecté
const medecinConnecte = localStorage.getItem('nom_utilisateur');
 const handleLogout = () => {
    localStorage.removeItem('profil');
    localStorage.removeItem('nom_utilisateur');
    localStorage.removeItem('IdEntreprise');
    router.push('/connexion');
  };
  return (
    <>
    <style>{cardStyles}</style>
        
          <div className="container-fluid ">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0 text-primary fw-bold">
                <FaClock className="me-2" />
                {medecinConnecte} "Bienvenue sur votre tableau de bord" 
              </h2>
              <Button variant="outline-danger" onClick={handleLogout}>
                Se déconnecter
              </Button>
            </div>
            <Row className="g-3">
              <Col md={4}>
                <Card className="shadow h-75 border-0 my-2" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  transition: 'transform 0.3s ease'
                }}>
                  <Card.Body className=" d-flex justify-content-center align-items-center mx-3 py-4">
                    <div className="mb-2">
                      <FaUserCheck size={48} className="mb-2" />
                    </div>
                    <Card.Title className="text-white mb-2">Patients reçus du jour</Card.Title>
                    <div>
                      <Badge bg="light" text="dark" className="fs-6">
                        {loading ? '...' : statistiques.patientsRecus}
                      </Badge>
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
                    <div className="mb-2">
                      <FaFlask size={48} className="mb-2" />
                    </div>
                    <Card.Title className="text-white mb-2">Patients en attente du jour</Card.Title>
                    <div>
                      <Badge bg="light" text="dark" className="fs-6">
                        {loading ? '...' : statistiques.patientsEnAttente}
                      </Badge>
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
                    <div className="mb-2">
                      <FaFileInvoice size={48} className="mb-3" />
                    </div>
                    <Card.Title className="text-white mb-2">Rendez-vous du jour</Card.Title>
                    <div>
                      <Badge bg="light" text="dark" className="fs-6">
                        {loading ? '...' : statistiques.rendezVousDuJour}
                      </Badge>
                    </div>
                    
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
          <div>
            <ListePatientsMedecin />
          </div>
   </>
  );
}
