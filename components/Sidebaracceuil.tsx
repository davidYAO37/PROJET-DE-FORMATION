'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { HouseDoorFill, ArrowRightCircleFill, PeopleFill, Clipboard2PulseFill, CalendarFill, Calendar2CheckFill, ClockFill, PencilSquare, KeyFill } from 'react-bootstrap-icons';

const menu = [
  { label: 'Tableau de bord', path: '/pages/serviceaccueil/tpatient', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Accueil Patient', path: '/pages/serviceaccueil/patient', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Transférer un patient', path: '/transfert-patient', icon: <ArrowRightCircleFill size={24} className="me-2" /> },
  { label: 'Salle d\'attente', path: '/salle-attente', icon: <PeopleFill size={24} className="me-2" /> },
  { label: 'Constantes', path: '/constantes', icon: <Clipboard2PulseFill size={24} className="me-2" /> },
  { label: 'Planning Médecin', path: '/planning-medecin', icon: <CalendarFill size={24} className="me-2" /> },
  { label: 'Disponibilité Médecin', path: '/disponibilite-medecin', icon: <Calendar2CheckFill size={24} className="me-2" /> },
  { label: 'Gestion Rendez-Vous', path: '/rendez-vous', icon: <ClockFill size={24} className="me-2" /> },
  { label: 'POINT DE SAISIE', path: '/point-saisie', icon: <PencilSquare size={24} className="me-2" /> },
  { label: 'Gérer mon Mot De Passe', path: '/mot-de-passe', icon: <KeyFill size={24} className="me-2" /> },
];

export default function Sidebaraccueil() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Ferme la sidebar quand on clique sur un lien (mobile)
  const handleLinkClick = () => setOpen(false);

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
              <Link
                href={item.path}
                className={`sidebar-link-medical d-flex align-items-center ${pathname === item.path ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </Nav.Item>
          ))}
        </Nav>
      </aside>
    </>
  );
}
