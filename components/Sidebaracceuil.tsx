'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import TransfertPatientModal from '@/app/pages/serviceaccueil/componant/TransfertPatientModal';
import SalleAttenteModal from '@/app/pages/serviceaccueil/componant/SalleAttenteModal';
import SalleConstante from '@/app/pages/serviceaccueil/componant/SalleConstante';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';
import PlanningModal from '@/components/PlanningModal';

const menu = [
  { label: 'Tableau de bord', path: '/pages/serviceaccueil/tpatient', icon: <i className="bi bi-speedometer2 me-2 text-primary"></i> },
  { label: 'Accueil Patient', path: '/pages/serviceaccueil/patient', icon: <i className="bi bi-house-door-fill me-2 text-success"></i> },
  { label: 'Transférer un patient', path: '#', isModal: true, icon: <i className="bi bi-arrow-right-circle-fill me-2 text-info"></i> },
  { label: 'Salle d\'attente', path: '#', isModal: true, icon: <i className="bi bi-people-fill me-2 text-warning"></i> },
  { label: 'Constantes', path: '/constantes', icon: <i className="bi bi-clipboard2-pulse-fill me-2 text-danger"></i> },
  { label: 'Planning Médecin', path: '#', isModal: true, icon: <i className="bi bi-calendar-fill me-2 text-primary"></i> },
  { label: 'Disponibilité Médecin', path: '/disponibilite-medecin', icon: <i className="bi bi-calendar2-check-fill me-2 text-success"></i> },
  { label: 'Gestion Rendez-Vous', path: '/rendez-vous', icon: <i className="bi bi-clock-fill me-2 text-info"></i> },
  { label: 'Point de saisie', path: '/point-saisie', icon: <i className="bi bi-pencil-square me-2 text-secondary"></i> },
  { label: 'Mot de passe', path: '#', isModal: true, icon: <i className="bi bi-key-fill me-2 text-dark"></i> },
];

export default function Sidebaracceuil() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showTransfertModal, setShowTransfertModal] = useState(false);
  const [showSalleAttenteModal, setShowSalleAttenteModal] = useState(false);
  const [showSalleConstanteModal, setShowSalleConstanteModal] = useState(false);
  const [showModifierMotDePasseModal, setShowModifierMotDePasseModal] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [user, setUser] = useState('');

  // Charger l'utilisateur connecté au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
    setUser(storedUser);
  }, []);

  // Ferme la sidebar quand on clique sur un lien (mobile)
  const handleLinkClick = () => setOpen(false);

  // Ouvre le modal de transfert
  const handleTransfertClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowTransfertModal(true);
    setOpen(false);
  };

  // Ouvre le modal de salle d'attente
  const handleSalleAttenteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Salle d\'attente clicked'); // Debug log
    setShowSalleAttenteModal(true);
    setOpen(false);
  };

  // Ouvre le modal de saisie des constantes
  const handleSalleConstanteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSalleConstanteModal(true);
    setOpen(false);
  };

  // Ouvre le modal de modification du mot de passe
  const handleMotDePasseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModifierMotDePasseModal(true);
    setOpen(false);
  };

  // Ouvre le modal de planning médecin
  const handlePlanningClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPlanningModal(true);
    setOpen(false);
  };

  return (
    <>
      {/* Bouton burger visible sur mobile */}
      <button
        className="sidebar-burger-medical d-md-none"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
      >
        <span className="sidebar-burger-bar"></span>
        <span className="sidebar-burger-bar"></span>
        <span className="sidebar-burger-bar"></span>
      </button>

      {/* Overlay mobile */}
      {open && <div className="sidebar-overlay-medical" onClick={() => setOpen(false)}></div>}

      <aside className={`sidebar-medical${open ? ' open' : ''}`}>
        {/* Logo médical moderne */}
        <div className="sidebar-logo-medical mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="20" y="8" width="8" height="32" rx="4" fill="#fff" />
            <rect x="8" y="20" width="32" height="8" rx="4" fill="#fff" />
            <rect x="22" y="10" width="4" height="28" rx="2" fill="#38bdf8" />
            <rect x="10" y="22" width="28" height="4" rx="2" fill="#38bdf8" />
          </svg>
          <span className="sidebar-title-medical ms-2">EasyMedical</span>
        </div>
        <hr className="sidebar-separator-medical" />
        <Nav className="flex-column px-3">
          {menu.map((item, index) => (
            <Nav.Item key={index} className="mb-2">
              {item.label === 'Constantes' ? (
                <a
                  href="#"
                  className="sidebar-link-medical d-flex align-items-center"
                  onClick={handleSalleConstanteClick}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ) : item.isModal ? (
                <a
                  href="#"
                  className="sidebar-link-medical d-flex align-items-center"
                  onClick={item.label === 'Transférer un patient' ? handleTransfertClick : item.label === 'Salle d\'attente' ? handleSalleAttenteClick : item.label === 'Mot de passe' ? handleMotDePasseClick : item.label === 'Planning Médecin' ? handlePlanningClick : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ) : (
                <Link
                  href={item.path}
                  className={`sidebar-link-medical d-flex align-items-center ${pathname === item.path ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </Nav.Item>
          ))}
        </Nav>
      </aside>

      {/* Modal de transfert de patient */}
      <TransfertPatientModal
        show={showTransfertModal}
        onHide={() => setShowTransfertModal(false)}
      />

      {/* Modal de salle d'attente */}
      <SalleAttenteModal
        show={showSalleAttenteModal}
        onHide={() => {
          console.log('Modal closed'); // Debug log
          setShowSalleAttenteModal(false);
        }}
      />

      {/* Modal de saisie des constantes */}
      <SalleConstante
        show={showSalleConstanteModal}
        onHide={() => setShowSalleConstanteModal(false)}
        user={user}
      />

      {/* Modal de modification du mot de passe */}
      <ModifierMotDePasseModal
        show={showModifierMotDePasseModal}
        onHide={() => setShowModifierMotDePasseModal(false)}
      />

      {/* Modal de planning médecin */}
      <PlanningModal
        show={showPlanningModal}
        onHide={() => setShowPlanningModal(false)}
      />
    </>
  );
}
