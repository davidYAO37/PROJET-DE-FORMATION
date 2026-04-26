'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'warning' | 'danger' | 'info'>('info');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsLocked(false);
    setRemainingAttempts(null);
    
    try {
      // Connexion avec API locale
      const res = await axios.post('/api/login', {
        email: email,
        password: motDePasse,
      });

      if (!res.data || !res.data.user) {
        setMessage('Email ou mot de passe incorrect');
        setMessageType('danger');
        setLoading(false);
        return;
      }

      // Stockage du profil utilisateur dans le localStorage
      const profil = res.data.user;

      if (profil) {
        localStorage.setItem('profil', JSON.stringify(profil));
        // Stocke le nom complet pour la fiche consultation
        const nomComplet = `${profil.nom || ''} ${profil.prenom || ''}`.trim();
        localStorage.setItem('nom_utilisateur', nomComplet);
        // Stocke l'id entreprise
        if (profil.entrepriseId) {
          localStorage.setItem('IdEntreprise', profil.entrepriseId);
        }

        setMessage('✅ Connexion réussie ! Redirection...');
        setMessageType('success');

        // ✅ Redirection selon le rôle après un court délai
        setTimeout(() => {
          if (profil?.type === 'admin') router.push('/dashboard');
          else if (profil?.type === 'medecin') router.push('/pages/servicemedecin/tmedecin');
          else if (profil?.type === 'infirmier') router.push('/pages/serviceinfirmier/tinfirmier');
          else if (profil?.type === 'pharmacien') router.push('/pages/servicepharmacie/tpharmacie');
          else if (profil?.type === 'radiologue') router.push('/pages/serviceradiologie/tradiologue');
          else if (profil?.type === 'technicienlabo') router.push('/pages/servicelaboratoire/tlabo');
          else if (profil?.type === 'caisse') router.push('/pages/servicecaisse/tcaisse');
          else if (profil?.type === 'comptable') router.push('/pages/servicecomptable/tcomptable');
          else if (profil?.type === 'accueil') router.push('/pages/serviceaccueil/tpatient');
          else if (profil?.type === 'adminsuper') router.push('/dashboard');
        }, 1000);
      } else {
        setMessage('Erreur lors de la récupération du profil');
        setMessageType('danger');
      }
    } catch (error: any) {
      console.error(error);
      
      if (error.response?.status === 423) {
        // Compte bloqué
        setIsLocked(true);
        setMessage(error.response.data.message || 'Compte temporairement bloqué');
        setMessageType('danger');
      } else if (error.response?.status === 401) {
        // Tentatives échouées
        const responseData = error.response.data;
        if (responseData.remainingAttempts !== undefined) {
          setRemainingAttempts(responseData.remainingAttempts);
          setMessage(responseData.message);
          setMessageType('warning');
        } else {
          setMessage('Email ou mot de passe incorrect');
          setMessageType('danger');
        }
      } else if (error.response?.status === 400) {
        setMessage(error.response.data.message);
        setMessageType('danger');
      } else {
        setMessage('Erreur de connexion');
        setMessageType('danger');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center login-background">
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }}>
          <Card className="p-4 shadow-lg border-0 bg-white bg-opacity-75">
            <Card.Body>
              <h2 className="text-center text-success mb-4">Connexion à votre espace santé</h2>
              
              {/* Messages d'information */}
              {message && (
                <div className={`alert alert-${messageType} d-flex align-items-center mb-4`}>
                  {messageType === 'success' && <i className="bi bi-check-circle-fill me-2"></i>}
                  {messageType === 'warning' && <i className="bi bi-exclamation-triangle-fill me-2"></i>}
                  {messageType === 'danger' && <i className="bi bi-x-circle-fill me-2"></i>}
                  {messageType === 'info' && <i className="bi bi-info-circle-fill me-2"></i>}
                  <div>
                    {message}
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <div className="small mt-1">
                        <strong>Tentatives restantes: {remainingAttempts}/4</strong>
                      </div>
                    )}
                    {remainingAttempts !== null && remainingAttempts === 0 && (
                      <div className="small mt-1">
                        <strong>Plus de tentatives disponibles</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Indicateur de compte bloqué */}
              {isLocked && (
                <div className="alert alert-danger d-flex align-items-center mb-4">
                  <i className="bi bi-lock-fill me-2"></i>
                  <div>
                    <strong>Compte bloqué</strong>
                    <div className="small">
                      Votre compte est temporairement bloqué. Veuillez contacter un administrateur pour le débloquer.
                    </div>
                  </div>
                </div>
              )}

              <Form onSubmit={handleConnexion}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button variant="success" type="submit" className="w-100" disabled={loading || isLocked}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Connexion...
                    </>
                  ) : isLocked ? (
                    <>
                      <i className="bi bi-lock-fill me-2"></i>
                      Compte bloqué
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
                {/* BOUTON RETOUR DASHBOARD */}
                <Button variant="secondary" className="w-100 mt-3" onClick={() => router.push ('/')}>
                  Retour
                </Button>
                  
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}