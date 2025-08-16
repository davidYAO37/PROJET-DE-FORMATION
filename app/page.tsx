'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { Button, Container, Row, Col, Navbar, Nav, Form, Alert, Spinner } from 'react-bootstrap';
import { FaUserMd, FaHospitalAlt, FaEnvelope, FaUser, FaRegEnvelope, FaCommentDots, FaRegBell, FaHeartbeat } from 'react-icons/fa';

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

  // Animation fade-in sur scroll pour chaque section
  useEffect(() => {
    const handleScroll = () => {
      document.querySelectorAll('.js-fade').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) {
          el.classList.add('fade-in');
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)' }}>
      {/* --- Barre de navigation principale --- */}
      <Navbar bg="white" expand="lg" className="shadow-sm fixed-top js-fade">
        <Container>
          <Navbar.Brand style={{ fontWeight: 700, color: '#0d6efd' }}>
            EasyMedical
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => scrollToSection('apropos')}>A propos de nous</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('partenaires')}>Nos partenaires</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('contact')}>Contactez-nous</Nav.Link>
              <Link href="/connexion" style={{ textDecoration: 'none' }}>
                <Button variant="success" size="sm" disabled={sending}>
                  {sending && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                  Mon espace
                </Button>
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <section
        className="hero-section-sante position-relative overflow-hidden d-flex align-items-center"
        style={{ minHeight: 500, background: "linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)" }}
      >
        {/* --- Arrière-plan SVG moderne --- */}
        <svg
          className="hero-bg position-absolute top-0 start-0"
          width="560"
          height="560"
          viewBox="0 0 560 560"
          fill="none"
          style={{ zIndex: 0, opacity: 0.2 }}
        >
          <circle cx="280" cy="280" r="260" fill="#0dcaf0" fillOpacity="0.12" />
          <circle cx="420" cy="140" r="90" fill="#198754" fillOpacity="0.18" />
          <rect x="240" y="100" width="80" height="360" rx="40" fill="#0d6efd" fillOpacity="0.08" />
        </svg>

        <Container
          className="hero-container text-center position-relative"
          style={{ zIndex: 1 }}
        >
          <Row className="justify-content-center">
            <Col md={10} lg={7}>

              {/* --- Bloc principal --- */}
              <div className="hero-card bg-white shadow-lg rounded-4 p-5 animate__animated animate__fadeInUp mt-5 mb-2">
                <h5 className="display-5 fw-bold mb-3 text-success">
                  <FaUserMd className="me-2 text-primary" />
                  GESTION MODERNE DE SANTÉ
                </h5>
                <p className="lead mb-4 text-muted">
                  Centralisez vos dossiers médicaux, améliorez le suivi patient et optimisez vos services de santé grâce à une plateforme sécurisée et intuitive.
                </p>

                {/* --- Badges clés --- */}
                <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                  <span className="badge bg-primary-subtle text-primary">
                    <FaHospitalAlt className="me-1" /> Dossiers numériques
                  </span>
                  <span className="badge bg-success-subtle text-success">
                    <FaUser className="me-1" /> Suivi intelligent
                  </span>
                  <span className="badge bg-warning-subtle text-warning">
                    <FaRegBell className="me-1" /> Alertes & rappels
                  </span>
                  <span className="badge bg-danger-subtle text-danger">
                    <FaHeartbeat className="me-1" /> Santé préventive
                  </span>
                </div>

                {/* --- Bouton d’accès --- */}
                <Link href="/connexion" className="text-decoration-none">
                  <Button
                    variant="success"
                    size="lg"
                    className="shadow-lg px-4 py-2 fw-bold"
                    disabled={sending}
                  >
                    {sending && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                    Accéder à mon espace
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Section A propos --- */}
      <section id="apropos" className="py-5 bg-white js-fade">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <h2 className="fw-bold mb-3 text-primary">A propos de EasyMedical</h2>
              <p className="lead text-muted">
                <u className="text-danger fw-bold">EasyMedical</u> est une solution intégrée qui vise à moderniser la gestion des services de santé. Notre mission est de soutenir les
                structures médicales dans leur transformation digitale en mettant à leur disposition des outils fiables, sécurisés et conformes
                aux standards internationaux.
              </p>
              <p className="lead text-muted">
                EasyMedical est une plateforme moderne dédiée à la gestion efficace des dossiers médicaux, au suivi des patients et à la simplification des processus pour les professionnels de santé.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Section Nos partenaires --- */}
      <section id="partenaires" className="py-5 bg-light js-fade position-relative">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <h2 className="fw-bold mb-3 text-primary">Nos partenaires</h2>
              <p className="text-muted mb-4">
                Nous collaborons avec des institutions et acteurs de santé de
                premier plan afin de garantir une qualité de service optimale et
                une innovation continue.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-4 mt-4 partenaires-logos-medical">
                {/* Logos des partenaires (exemple) */}
                <img src="/images/auth.jpg" alt="Partenaire 1" className="partenaire-logo-medical js-hover" />
                <img src="/images/auth1.jpg" alt="Partenaire 2" className="partenaire-logo-medical js-hover" />
                <img src="/images/inscription.jpeg" alt="Partenaire 3" className="partenaire-logo-medical js-hover" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Section Contactez-nous --- */}
      <section id="contact" className="py-5 bg-white js-fade position-relative">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <h2 className="fw-bold mb-3 text-primary text-center animate__animated animate__fadeInDown"><FaEnvelope className="me-2 text-info" />Contactez-nous</h2>
              <p className="text-center mb-4">Une question, une demande ? Envoyez-nous un message !</p>
              <p className="text-center mb-4 text-muted">
                Vous souhaitez obtenir plus d’informations ou entrer en relation
                avec notre équipe ? Merci de remplir le formulaire ci-dessous.
              </p>
              {/* Message de succès */}
              {sent && <Alert variant="success">Votre message a bien été envoyé !</Alert>}
              {/* Message d'erreur */}
              {error && <Alert variant="danger">{error}</Alert>}
              {/* Formulaire de contact */}
              <Form ref={formRef} onSubmit={handleSubmit} className="modern-contact-form-medical p-4 rounded-4 shadow-sm bg-light animate__animated animate__fadeInUp">
                <Form.Group className="mb-3 position-relative" controlId="formNom">
                  <Form.Label><FaUser className="me-2 text-primary" />Nom</Form.Label>
                  <Form.Control type="text" name="nom" placeholder="Votre nom complet" required disabled={sending} autoComplete="name" />
                </Form.Group>
                <Form.Group className="mb-3 position-relative" controlId="formEmail">
                  <Form.Label><FaRegEnvelope className="me-2 text-primary" />Email</Form.Label>
                  <Form.Control type="email" name="email" placeholder="Votre email" required disabled={sending} autoComplete="email" />
                </Form.Group>
                <Form.Group className="mb-3 position-relative" controlId="formMessage">
                  <Form.Label><FaCommentDots className="me-2 text-primary" />Message</Form.Label>
                  <Form.Control as="textarea" name="message" rows={4} placeholder="Votre message" required disabled={sending} />
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" variant="primary" size="lg" disabled={sending} className="shadow hero-btn-animated">
                    {sending && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                    {sending ? 'Envoi en cours...' : 'Envoyer'}
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Pied de page --- */}
      <footer className="py-4 bg-light text-center mt-auto js-fade">
        <Container>
          <span className="text-muted">&copy; {new Date().getFullYear()} EasyMedical. Tous droits réservés.</span>
        </Container>
      </footer>
    </div>
  );
}
