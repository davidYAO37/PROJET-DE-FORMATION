'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { Button, Container, Row, Col, Navbar, Nav, Form, Alert, Spinner, Carousel, Card } from 'react-bootstrap';
import {
  Building, Database, ShieldCheck, FileText, Envelope, ArrowRight,
  CheckCircle, People, GraphUp, ClipboardPulse, Cart, CreditCard2Front,
  JournalMedical, HeartPulse
} from 'react-bootstrap-icons';

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingSuperAdmin, setCreatingSuperAdmin] = useState(false);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [loadingEntreprises, setLoadingEntreprises] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);

  const chargerEntreprises = async () => {
    setLoadingEntreprises(true);
    try {
      const response = await fetch('/api/entreprises');
      if (response.ok) {
        const data = await response.json();
        setEntreprises(data.data || []);
      } else {
        console.error('Erreur lors du chargement des entreprises');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingEntreprises(false);
    }
  };

  const chargerTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      const response = await fetch('/api/testimonials');
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.data || []);
      } else {
        console.error('Erreur lors du chargement des témoignages');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  useEffect(() => {
    chargerEntreprises();
    chargerTestimonials();
  }, []);

  const createSuperAdminIfNeeded = async () => {
    setCreatingSuperAdmin(true);
    try {
      const checkResponse = await fetch('/api/check-users');
      const checkData = await checkResponse.json();

      if (checkData.userCount === 0) {
        console.log('🚀 Création du super admin...');
        const createResponse = await fetch('/api/check-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (createResponse.ok) {
          const createData = await createResponse.json();
          console.log('✅ Super admin créé:', createData.message);
        } else {
          console.error('❌ Erreur lors de la création du super admin');
        }
      } else {
        console.log('ℹ️ Le super admin existe déjà');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification/création du super admin:', error);
    } finally {
      setCreatingSuperAdmin(false);
    }
  };

  const handleAccessSpace = async () => {
    await createSuperAdminIfNeeded();
    window.location.href = '/connexion';
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSent(false);
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    const nom = formData.get('nom');
    const email = formData.get('email');
    const message = formData.get('message');
    try {
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

  const TestimonialCard = ({ testimonial }: { testimonial: any }) => (
    <Card className="h-100 border-0 shadow rounded-4 p-4 hover-lift">
      <Card.Body>
        <div className="text-warning mb-3">
          {'★'.repeat(testimonial.rating || 5)}{'☆'.repeat(5 - (testimonial.rating || 5))}
        </div>
        <Card.Text className="text-muted fst-italic mb-4">"{testimonial.text}"</Card.Text>
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)' }}
          >
            {testimonial.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="mb-0 fw-bold">{testimonial.name}</p>
            <p className="mb-0 small text-muted">{testimonial.role}</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

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

  const features = [
    { icon: <ClipboardPulse size={28} />, title: 'Dossier patient numérique', text: 'Identité, antécédents, allergies, assurances et documents centralisés.' },
    { icon: <People size={28} />, title: 'Parcours de soins', text: 'Consultations, prescriptions, examens, hospitalisations et rendez-vous.' },
    { icon: <CreditCard2Front size={28} />, title: 'Facturation & caisse', text: 'Factures, encaissements, provisions, honoraires et assurances.' },
    { icon: <Cart size={28} />, title: 'Pharmacie & stock', text: 'Dispensation, inventaire, entrées/sorties et commandes fournisseurs.' },
    { icon: <JournalMedical size={28} />, title: 'Laboratoire & radio', text: 'Saisie, validation et impression des résultats biologiques et imagerie.' },
    { icon: <GraphUp size={28} />, title: 'Comptabilité & stats', text: 'Journaux de caisse, états financiers et tableaux de bord.' },
  ];

  const dataDomains = [
    { icon: <Building size={32} />, title: 'Cœur métier', items: ['Patients', 'Utilisateurs', 'Médecins', 'Infirmiers', 'Établissements'] },
    { icon: <HeartPulse size={32} />, title: 'Soins', items: ['Consultations', 'Examens', 'Prescriptions', 'Hospitalisations', 'Rendez-vous'] },
    { icon: <FileText size={32} />, title: 'Facturation', items: ['Factures', 'Encaissements', 'Annulations', 'Honoraires', 'Assurances'] },
    { icon: <Database size={32} />, title: 'Pharmacie & Stock', items: ['Produits', 'Entrées/sorties', 'Inventaires', 'Fournisseurs', 'Mouvements'] },
    { icon: <JournalMedical size={32} />, title: 'Laboratoire', items: ['Prestations', 'Paramètres bio.', 'Résultats', 'Automates', 'Comptes-rendus'] },
    { icon: <ShieldCheck size={32} />, title: 'Assurances', items: ['Assurances', 'Sociétés', 'Tarifs conventionnés', 'Partenaires', 'Documents'] },
  ];

  const benefits = [
    { icon: <Building size={34} />, title: 'Centralisation', text: 'Un seul outil pour gérer soins, facturation, caisse et pharmacie.' },
    { icon: <People size={34} />, title: 'Productivité', text: 'Gain de temps à l’accueil et accès rapide au dossier patient.' },
    { icon: <CreditCard2Front size={34} />, title: 'Maîtrise financière', text: 'Suivi des encaissements, provisions, factures et impayés.' },
    { icon: <GraphUp size={34} />, title: 'Pilotage', text: 'Tableaux de bord et statistiques pour décider sur des données fiables.' },
  ];

  const steps = [
    { icon: <CheckCircle size={24} />, text: 'Présentation personnalisée aux parties prenantes' },
    { icon: <CheckCircle size={24} />, text: 'Démonstration des modules prioritaires' },
    { icon: <CheckCircle size={24} />, text: 'Étude des besoins spécifiques' },
    { icon: <CheckCircle size={24} />, text: 'Planification du déploiement et de la formation' },
  ];

  const stats = [
    { value: '10+', label: 'Services intégrés' },
    { value: '63+', label: 'Modules de données' },
    { value: '100%', label: 'Sécurisé' },
    { value: '24/7', label: 'Disponibilité' },
  ];

  const howItWorks = [
    { step: '01', title: 'Accueil du patient', desc: 'Enregistrement rapide du dossier et orientation vers le bon service.' },
    { step: '02', title: 'Consultation & soins', desc: 'Le praticien accède au dossier, prescrit et planifie les examens.' },
    { step: '03', title: 'Facturation & caisse', desc: 'Génération automatique de la facture et encaissement sécurisé.' },
    { step: '04', title: 'Suivi & statistiques', desc: 'Tableaux de bord et rapports pour piloter l’activité.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)' }}>
      {/* --- Navbar --- */}
      <Navbar bg="white" expand="lg" className="shadow-sm fixed-top js-fade" style={{ zIndex: 1030 }}>
        <Container>
          <Navbar.Brand style={{ fontWeight: 700, color: '#0d6efd', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartPulse size={28} />
            EasyMedical
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto align-items-center">
              <Nav.Link onClick={() => scrollToSection('overview')}>Vue d’ensemble</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('data')}>Données</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('benefits')}>Avantages</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('partenaires')}>Partenaires</Nav.Link>
              <Nav.Link onClick={() => scrollToSection('contact')}>Contactez-nous</Nav.Link>              
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* --- Hero --- */}
      <section
        className="position-relative overflow-hidden d-flex align-items-center hero-gradient-animated"
        style={{ minHeight: '100vh', paddingTop: 80 }}
      >
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />

        <Container className="position-relative" style={{ zIndex: 1 }}>
          <Row className="align-items-center gy-5">
            <Col lg={6} className="animate__animated animate__fadeInLeft">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3" style={{ background: 'rgba(13,110,253,0.08)', color: '#0d6efd' }}>
                <span className="badge rounded-pill bg-primary">Nouveau</span>
                <span className="small fw-semibold">Solution tout-en-un pour la santé</span>
              </div>
              <h1 className="display-4 fw-bold mb-4" style={{ color: '#0d47a1', lineHeight: 1.2 }}>
                Simplifiez la gestion de votre établissement de santé
              </h1>
              <p className="lead mb-4 text-muted">
                Centralisez dossiers patients, consultations, facturation, pharmacie et comptabilité dans une plateforme moderne, sécurisée et intuitive.
              </p>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="shadow px-4 fw-bold"
                  disabled={sending || creatingSuperAdmin}
                  onClick={handleAccessSpace}
                >
                  {(sending || creatingSuperAdmin) && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                  {creatingSuperAdmin ? 'Configuration...' : 'Accéder à mon espace'}
                  {!creatingSuperAdmin && <ArrowRight className="ms-2" size={18} />}
                </Button>
                <Button
                  variant="outline-primary"
                  size="lg"
                  className="px-4 fw-semibold"
                  onClick={() => scrollToSection('contact')}
                >
                  Demander une démo
                </Button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-white text-primary border">Dossiers numériques</span>
                <span className="badge bg-white text-success border">Facturation</span>
                <span className="badge bg-white text-info border">Pharmacie</span>
                <span className="badge bg-white text-warning border">Laboratoire</span>
              </div>
            </Col>
            <Col lg={6} className="text-center animate__animated animate__fadeInRight">
              <div className="hero-illustration position-relative d-inline-block">
                <svg width="520" height="420" viewBox="0 0 520 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="img-fluid">
                  <rect x="60" y="60" width="400" height="300" rx="24" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
                  <rect x="90" y="100" width="120" height="16" rx="8" fill="#0d6efd" opacity="0.15" />
                  <rect x="90" y="132" width="80" height="12" rx="6" fill="#94a3b8" />
                  <rect x="90" y="160" width="180" height="12" rx="6" fill="#cbd5e1" />
                  <rect x="90" y="190" width="160" height="12" rx="6" fill="#cbd5e1" />
                  <rect x="90" y="230" width="340" height="100" rx="12" fill="#f1f5f9" />
                  <circle cx="135" cy="280" r="24" fill="#0dcaf0" opacity="0.2" />
                  <path d="M128 280h14M135 273v14" stroke="#0d6efd" strokeWidth="3" strokeLinecap="round" />
                  <rect x="180" y="265" width="100" height="10" rx="5" fill="#64748b" />
                  <rect x="180" y="285" width="70" height="8" rx="4" fill="#94a3b8" />
                  <rect x="310" y="265" width="90" height="32" rx="8" fill="#198754" opacity="0.15" />
                  <rect x="325" y="273" width="60" height="16" rx="4" fill="#198754" />
                  <circle cx="420" cy="120" r="40" fill="#0d6efd" opacity="0.08" />
                  <circle cx="420" cy="120" r="28" fill="#0d6efd" opacity="0.12" />
                  <rect x="405" y="108" width="30" height="8" rx="4" fill="#0d6efd" opacity="0.6" />
                  <rect x="405" y="124" width="30" height="8" rx="4" fill="#0d6efd" opacity="0.6" />
                </svg>
                <div className="hero-floating-card d-none d-md-block" style={{ position: 'absolute', bottom: 40, left: -30, background: '#fff', padding: '14px 18px', borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(25,135,84,0.1)' }}>
                      <HeartPulse size={22} color="#198754" />
                    </div>
                    <div>
                      <p className="mb-0 fw-bold text-dark">+150</p>
                      <p className="mb-0 small text-muted">Patients suivis</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Stats --- */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #0d6efd 100%)' }}>
        <Container>
          <Row className="g-4 text-center">
            {stats.map((s, i) => (
              <Col key={i} md={3} sm={6}>
                <div className="text-white">
                  <h3 className="display-5 fw-bold mb-1">{s.value}</h3>
                  <p className="mb-0 opacity-75">{s.label}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* --- Vue d'ensemble --- */}
      <section id="overview" className="py-5 bg-white js-fade">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col md={8} className="text-center">
              <h6 className="text-uppercase fw-bold text-info mb-2">Vue d’ensemble</h6>
              <h2 className="fw-bold mb-3 text-primary">Une plateforme complète pour les établissements de santé</h2>
              <p className="text-muted lead">
                Easy Medical est une application web multi-services dédiée aux cliniques, cabinets et centres de santé. Elle couvre l’accueil, les soins, la facturation, la caisse, la pharmacie, le laboratoire et la comptabilité dans une interface unique.
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            {features.map((f, i) => (
              <Col key={i} md={6} lg={4}>
                <Card className="h-100 border-0 shadow-sm rounded-4 p-3 hover-shadow">
                  <Card.Body>
                    <div className="text-primary mb-3">{f.icon}</div>
                    <Card.Title className="fw-bold">{f.title}</Card.Title>
                    <Card.Text className="text-muted">{f.text}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* --- Modèle de données --- */}
      <section id="data" className="py-5 bg-light js-fade">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col md={8} className="text-center">
              <h6 className="text-uppercase fw-bold text-info mb-2">Modèle de données</h6>
              <h2 className="fw-bold mb-3 text-primary">Une base structurée autour de 6 domaines métiers</h2>
              <p className="text-muted lead">
                L’application s’appuie sur une base de données robuste organisée autour des entités essentielles du système de santé.
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            {dataDomains.map((d, i) => (
              <Col key={i} md={6} lg={4}>
                <Card className="h-100 border-0 shadow-sm rounded-4 p-3">
                  <Card.Body>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="text-primary">{d.icon}</div>
                      <h5 className="fw-bold mb-0">{d.title}</h5>
                    </div>
                    <ul className="list-unstyled text-muted mb-0">
                      {d.items.map((item, idx) => (
                        <li key={idx} className="d-flex align-items-center gap-2 mb-2">
                          <CheckCircle size={16} className="text-success" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* --- Avantages --- */}
      <section id="benefits" className="py-5 bg-white js-fade">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col md={8} className="text-center">
              <h6 className="text-uppercase fw-bold text-info mb-2">Avantages</h6>
              <h2 className="fw-bold mb-3 text-primary">Pourquoi choisir Easy Medical ?</h2>
            </Col>
          </Row>
          <Row className="g-4">
            {benefits.map((b, i) => (
              <Col key={i} md={6} lg={3}>
                <Card className="h-100 border-0 shadow rounded-4 p-4 text-center hover-lift">
                  <Card.Body>
                    <div className="text-primary mb-3">{b.icon}</div>
                    <Card.Title className="fw-bold">{b.title}</Card.Title>
                    <Card.Text className="text-muted">{b.text}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* --- Comment ça marche --- */}
      <section id="how" className="py-5 bg-light js-fade">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col md={8} className="text-center">
              <h6 className="text-uppercase fw-bold text-info mb-2">Comment ça marche</h6>
              <h2 className="fw-bold mb-3 text-primary">Un parcours simple en 4 étapes</h2>
              <p className="text-muted lead">
                De l’accueil du patient au pilotage de l’activité, Easy Medical accompagne chaque étape du processus.
              </p>
            </Col>
          </Row>
          <Row className="g-4 justify-content-center">
            {howItWorks.map((h, i) => (
              <Col key={i} md={6} lg={3}>
                <Card className="h-100 border-0 shadow-sm rounded-4 p-4 text-center hover-shadow position-relative overflow-hidden">
                  <div className="position-absolute top-0 end-0 p-3 opacity-10" style={{ fontSize: 80, fontWeight: 800, color: '#0d6efd' }}>{h.step}</div>
                  <Card.Body className="position-relative" style={{ zIndex: 1 }}>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)', color: '#fff', fontWeight: 700 }}>
                      {h.step}
                    </div>
                    <Card.Title className="fw-bold">{h.title}</Card.Title>
                    <Card.Text className="text-muted">{h.desc}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* --- Partenaires --- */}
      <section id="partenaires" className="py-5 bg-white js-fade position-relative">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <h6 className="text-uppercase fw-bold text-info mb-2">Partenaires</h6>
              <h2 className="fw-bold mb-3 text-primary">Nos partenaires de confiance</h2>
              <p className="text-muted mb-4">
                Nous collaborons avec des institutions et acteurs de santé de premier plan pour garantir une qualité de service optimale.
              </p>
              <div className="mt-4">
                {loadingEntreprises ? (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                  </div>
                ) : entreprises.length > 0 ? (
                  <Carousel
                    indicators={true}
                    controls={true}
                    interval={3000}
                    pause="hover"
                    className="partenaires-carousel"
                    prevIcon={<span className="carousel-control-prev-icon" />}
                    nextIcon={<span className="carousel-control-next-icon" />}
                  >
                    {entreprises.reduce((acc: any[][], entreprise, index) => {
                      const chunkIndex = Math.floor(index / 4);
                      if (!acc[chunkIndex]) acc[chunkIndex] = [];
                      if (entreprise.LogoE) acc[chunkIndex].push(entreprise);
                      return acc;
                    }, []).filter((chunk) => chunk.length > 0).map((chunk, chunkIndex) => (
                      <Carousel.Item key={chunkIndex}>
                        <div className="d-flex justify-content-center gap-4 partenaires-slide">
                          {chunk.map((entreprise, index) => (
                            <div key={index} className="text-center partenaire-item">
                              <img
                                src={entreprise.LogoE}
                                alt={entreprise.NomSociete || `Partenaire ${chunkIndex * 4 + index + 1}`}
                                className="partenaire-logo-medical"
                                title={entreprise.NomSociete || ''}
                              />
                              <p className="mt-2 mb-0 small text-muted fw-semibold">
                                {entreprise.NomSociete || `Partenaire ${chunkIndex * 4 + index + 1}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                ) : (
                  <p className="text-muted">Aucun partenaire à afficher</p>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Témoignages --- */}
      <section id="testimonials" className="py-5 bg-light js-fade">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col md={8} className="text-center">
              <h6 className="text-uppercase fw-bold text-info mb-2">Témoignages</h6>
              <h2 className="fw-bold mb-3 text-primary">Ce que disent nos utilisateurs</h2>
              <p className="text-muted lead">
                Des professionnels de santé nous font confiance au quotidien.
              </p>
            </Col>
          </Row>

          {loadingTestimonials ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          ) : testimonials.length === 0 ? (
            <p className="text-center text-muted">Aucun témoignage à afficher pour le moment.</p>
          ) : testimonials.length <= 3 ? (
            <Row className="g-4">
              {testimonials.map((t: any, i: number) => (
                <Col key={i} md={4}>
                  <TestimonialCard testimonial={t} />
                </Col>
              ))}
            </Row>
          ) : (
            <Carousel indicators={false} controls={true} interval={5000} pause="hover" className="testimonials-carousel">
              {testimonials.reduce((acc: any[][], t: any, index: number) => {
                const chunkIndex = Math.floor(index / 3);
                if (!acc[chunkIndex]) acc[chunkIndex] = [];
                acc[chunkIndex].push(t);
                return acc;
              }, []).map((chunk: any[], idx: number) => (
                <Carousel.Item key={idx}>
                  <Row className="g-4 justify-content-center">
                    {chunk.map((t: any, i: number) => (
                      <Col key={i} md={4}>
                        <TestimonialCard testimonial={t} />
                      </Col>
                    ))}
                  </Row>
                </Carousel.Item>
              ))}
            </Carousel>
          )}
        </Container>
      </section>

      {/* --- Contact --- */}
      <section id="contact" className="py-5 bg-white js-fade">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col md={8} className="text-center">
              <h6 className="text-uppercase fw-bold text-info mb-2">Contact</h6>
              <h2 className="fw-bold mb-3 text-primary"><Envelope className="me-2 text-info" />Contactez-nous</h2>
              <p className="text-muted lead">
                Vous souhaitez une démonstration ou plus d’informations ? Envoyez-nous un message et nous vous répondrons rapidement.
              </p>
            </Col>
          </Row>
          <Row className="justify-content-center align-items-stretch g-4">
            <Col lg={5}>
              <Card className="h-100 border-0 shadow-sm rounded-4 p-4 bg-light">
                <Card.Body>
                  <h5 className="fw-bold text-primary mb-4">Prochaines étapes</h5>
                  <ul className="list-unstyled">
                    {steps.map((s, i) => (
                      <li key={i} className="d-flex align-items-start gap-3 mb-3">
                        <div className="text-success mt-1">{s.icon}</div>
                        <span className="text-muted">{s.text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 rounded-3" style={{ background: '#e3f2fd' }}>
                    <p className="mb-0 text-muted small">
                      <strong>Version actuelle :</strong> 0.1.0 — Phase de recette recommandée avant production.
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={5}>
              {sent && <Alert variant="success">Votre message a bien été envoyé !</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              <Form ref={formRef} onSubmit={handleSubmit} className="p-4 rounded-4 shadow-sm bg-light">
                <Form.Group className="mb-3" controlId="formNom">
                  <Form.Label>Nom complet</Form.Label>
                  <Form.Control type="text" name="nom" placeholder="Votre nom" required disabled={sending} autoComplete="name" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" placeholder="Votre email" required disabled={sending} autoComplete="email" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formMessage">
                  <Form.Label>Message</Form.Label>
                  <Form.Control as="textarea" name="message" rows={4} placeholder="Votre message" required disabled={sending} />
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" variant="primary" size="lg" disabled={sending} className="shadow hero-btn-animated">
                    {sending && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                    {sending ? 'Envoi en cours...' : 'Envoyer le message'}
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- Footer --- */}
      <footer className="py-5 text-white mt-auto js-fade" style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #0d6efd 100%)' }}>
        <Container>
          <Row className="gy-4">
            <Col md={4}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <HeartPulse size={28} />
                <h5 className="fw-bold mb-0">EasyMedical</h5>
              </div>
              <p className="opacity-75 small">
                Solution complète de gestion médicale pour cliniques, cabinets et centres de santé.
              </p>
            </Col>
            <Col md={4}>
              <h6 className="fw-bold mb-3">Liens rapides</h6>
              <ul className="list-unstyled small opacity-75">
                <li><Nav.Link onClick={() => scrollToSection('overview')} className="text-white p-0 mb-2 d-inline-block">Vue d’ensemble</Nav.Link></li>
                <li><Nav.Link onClick={() => scrollToSection('benefits')} className="text-white p-0 mb-2 d-inline-block">Avantages</Nav.Link></li>
                <li><Nav.Link onClick={() => scrollToSection('how')} className="text-white p-0 mb-2 d-inline-block">Comment ça marche</Nav.Link></li>
                <li><Nav.Link onClick={() => scrollToSection('contact')} className="text-white p-0 d-inline-block">Contact</Nav.Link></li>
              </ul>
            </Col>
            <Col md={4}>
              <h6 className="fw-bold mb-3">Contact</h6>
              <p className="small opacity-75 mb-1">yaoentier@gmail.com</p>
              <p className="small opacity-75 mb-1">+225 07 088 965 59 / +225 05 048 320 84</p>
              <p className="small opacity-75">Abidjan, Côte d’Ivoire</p>
            </Col>
          </Row>
          <hr className="border-white opacity-25 my-4" />
          <Row>
            <Col className="text-center">
              <span className="small opacity-75">&copy; {new Date().getFullYear()} EasyMedical. Tous droits réservés.</span>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}

