'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/configConnect';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Connexion avec Firebase Auth
      const data = await signInWithEmailAndPassword(auth, email, motDePasse);
      if (!data.user) {
        alert('Identifiants invalides');
        setLoading(false);
        return;
      }
      // Récupération du profil mongodb
      const res = await axios.post('/api/login', {
        uid: data.user.uid,
      });
      if (!res.data || !res.data.profilUtilisateur) {
        alert('Erreur lors de la récupération des données utilisateur');
        setLoading(false);
        return;
      }
      // Stockage du profil utilisateur dans le localStorage
      const profil = res.data.profilUtilisateur;

      if (profil) {
        localStorage.setItem('profil', JSON.stringify(profil));
        // Stocke le nom complet pour la fiche consultation
        const nomComplet = `${profil.nom || ''} ${profil.prenom || ''}`.trim();
        localStorage.setItem('nom_utilisateur', nomComplet);

        // ✅ Redirection selon le rôle
        if (profil?.type === 'admin') router.push('/dashboard');
        else if (profil?.type === 'medecin') router.push('/pages/servicemedecin/tmedecin');
        else router.push('/pages/serviceaccueil/tpatient');
      } else {
        alert(profil?.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erreur de connexion');
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
                <Button variant="success" type="submit" className="w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Connexion...
                    </>
                  ) : 'Se connecter'}
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


/* 'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const router = useRouter();

  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erreur de connexion');
    }
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex justify-content-center align-items-center login-background"
    >
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }}>
          <Card className="p-4 shadow-lg border-0 bg-white bg-opacity-75">
            <Card.Body>
              <h2 className="text-center text-success mb-4">
                Connexion à votre espace santé
              </h2>
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
                <Button variant="success" type="submit" className="w-100">
                  Se connecter
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
 */