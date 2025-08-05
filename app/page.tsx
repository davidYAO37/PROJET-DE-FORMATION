'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Button, Container, Row, Col, Navbar, Nav, Form, Alert } from 'react-bootstrap';

export default function Home() {
  // --- Gestion du formulaire de contact ---
  // Référence du formulaire
  const formRef = useRef<HTMLFormElement>(null);
  // État pour l'envoi
  const [sending, setSending] = useState(false);
  // État pour succès
  const [sent, setSent] = useState(false);
  // État pour erreur
  const [error, setError] = useState<string | null>(null);

  // Fonction pour scroller vers une section donnée
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Soumission réelle du formulaire de contact (appel API)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSent(false);
    // Récupération des données du formulaire
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    const nom = formData.get('nom');
    const email = formData.get('email');
    const message = formData.get('message');
    try {
      // Appel à l'API Next.js pour envoyer l'email
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, message }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'envoi.');
      setSent(true);
      if (formRef.current) formRef.current.reset();
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* --- Barre de navigation principale --- */}
      <Navbar bg="white" expand="lg" className="shadow-sm fixed-top">
        <Container>
          <Navbar.Brand style={{ fontWeight: 700, color: '#0d6efd' }}>
            EasyMedical
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => scrollToSection('apropos')}>A propos</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('partenaires')}>Nos partenaires</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('contact')}>Contactez-nous</Nav.Link>
              <Link href="/connexion" style={{ textDecoration: 'none' }}>
                <Button variant="success" size="sm">Espace</Button>
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* --- Section d'accueil (Hero) --- */}
      <section className="hero-section-medical">
        {/* Illustration vectorielle décorative en fond */}
        <svg className="hero-bg-medical" width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="210" cy="210" r="210" fill="#38bdf8" />
          <circle cx="320" cy="120" r="80" fill="#0d6efd" />
        </svg>
        <Container className="hero-container-medical d-flex flex-column justify-content-center align-items-center text-center">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              {/* Icône croix médicale stylisée */}
              {/*  <div className="medical-cross-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="20" y="8" width="8" height="32" rx="4" fill="#fff" />
                  <rect x="8" y="20" width="32" height="8" rx="4" fill="#fff" />
                  <rect x="22" y="10" width="4" height="28" rx="2" fill="#38bdf8" />
                  <rect x="10" y="22" width="28" height="4" rx="2" fill="#38bdf8" />
                </svg>
              </div> */}
              <div className="hero-card-medical">
                <h1 className="display-5 fw-bold mb-3 text-primary hero-title-medical">
                  GESTION SANTÉ EFFICACE
                </h1>
                <p className="lead mb-4 hero-lead-medical">
                  Simplifiez la gestion de vos dossiers médicaux et suivez vos patients en toute sécurité.
                </p>
                {/* Badges attractifs */}
                <div className="hero-badges-medical d-flex flex-wrap justify-content-center gap-2 mb-4">
                  <span className="badge-medical badge-blue">Dossiers numériques sécurisés</span>
                  <span className="badge-medical badge-indigo">Suivi patient intelligent</span>
                  <span className="badge-medical badge-yellow">Alertes & rappels santé</span>
                </div>
                <Link href="/connexion" className="hero-link-medical">
                  <Button
                    variant="primary"
                    size="lg"
                    className="hero-btn-medical"
                  >
                    Accéder à mon espace
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Section A propos --- */}
      <section id="apropos" className="py-5 bg-white">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <h2 className="fw-bold mb-3 text-primary">A propos</h2>
              <p className="lead">
                EasyMedical est une plateforme moderne dédiée à la gestion efficace des dossiers médicaux, au suivi des patients et à la simplification des processus pour les professionnels de santé.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Section Nos partenaires --- */}
      <section id="partenaires" className="py-5 bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <h2 className="fw-bold mb-3 text-primary">Nos partenaires</h2>
              <div className="d-flex flex-wrap justify-content-center gap-4 mt-4">
                {/* Logos des partenaires (exemple) */}
                <img src="/images/auth.jpg" alt="Partenaire 1" style={{ width: 120, borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
                <img src="/images/auth1.jpg" alt="Partenaire 2" style={{ width: 120, borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
                <img src="/images/inscription.jpeg" alt="Partenaire 3" style={{ width: 120, borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Section Contactez-nous --- */}
      <section id="contact" className="py-5 bg-white">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <h2 className="fw-bold mb-3 text-primary text-center">Contactez-nous</h2>
              <p className="text-center mb-4">Une question, une demande ? Envoyez-nous un message !</p>
              {/* Message de succès */}
              {sent && <Alert variant="success">Votre message a bien été envoyé !</Alert>}
              {/* Message d'erreur */}
              {error && <Alert variant="danger">{error}</Alert>}
              {/* Formulaire de contact */}
              <Form ref={formRef} onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formNom">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control type="text" name="nom" placeholder="Votre nom" required disabled={sending} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" placeholder="Votre email" required disabled={sending} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formMessage">
                  <Form.Label>Message</Form.Label>
                  <Form.Control as="textarea" name="message" rows={4} placeholder="Votre message" required disabled={sending} />
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" variant="primary" size="lg" disabled={sending}>
                    {sending ? 'Envoi en cours...' : 'Envoyer'}
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Pied de page --- */}
      <footer className="py-4 bg-light text-center mt-auto">
        <Container>
          <span className="text-muted">&copy; {new Date().getFullYear()} EasyMedical. Tous droits réservés.</span>
        </Container>
      </footer>
    </div>
  );
}
