'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';
import DisponibilitePrescriptuerModal from '@/app/pages/servicemedecin/tmedecin/composants/DisponibilitePrescripteurModal';

const menu = [
  { label: 'Tableau de bord', path: '/pages/servicemedecin/tmedecin', icon: <i className="bi bi-speedometer2 me-2 text-primary"></i> },
  { label: 'Patient en attente', path: '/pages/servicemedecin/ListePatientAttentes', icon: <i className="bi bi-clock-fill me-2 text-warning"></i> },
  { label: 'Mes Rendez-Vous', path: '#', isModal: true, modalType: 'rendezvous', icon: <i className="bi bi-calendar-check-fill me-2 text-success"></i> },
  { label: 'Saisir fiche prescription', path: '/constantes', icon: <i className="bi bi-file-earmark-text-fill me-2 text-primary"></i> },
  { label: 'Planning Médecin', path: '/planningMedecin', icon: <i className="bi bi-calendar-fill me-2 text-primary"></i> },
  { label: 'Mon planning', path: '/disponibiliteMedecin', icon: <i className="bi bi-clipboard-check-fill me-2 text-success"></i> },
  { label: 'Mes comptes rendus', path: '/rendezVous', icon: <i className="bi bi-file-earmark-text-fill me-2 text-secondary"></i> },
  { label: 'Statistiques', path: '/pointSaisie', icon: <i className="bi bi-bar-chart-fill me-2 text-info"></i> },
  { label: 'Mot de passe', path: '#', isModal: true, icon: <i className="bi bi-key-fill me-2 text-dark"></i> },
];

export default function SidebarMedecin() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showModifierMotDePasseModal, setShowModifierMotDePasseModal] = useState(false);
  const [user, setUser] = useState('');
  const [showDisponibiliteModal, setShowDisponibiliteModal] = useState(false);
  useEffect(() => {
    const storedUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
    setUser(storedUser);
  }, []);

  // Ferme la sidebar quand on clique sur un lien (mobile)
  const handleLinkClick = () => setOpen(false);

  // Ouvre le modal de modification du mot de passe
  const handleMotDePasseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModifierMotDePasseModal(true);
    setOpen(false);
  };

  // ouvre le modal de disponibilité du médecin
  const handleDisponibiliteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDisponibiliteModal(true);
    setOpen(false);
  };

  // Gestionnaire pour les clics sur les modaux
  const handleModalClick = (e: React.MouseEvent, modalType: string) => {
    e.preventDefault();
    if (modalType === 'rendezvous') {
      setShowDisponibiliteModal(true);
    }
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
              {item.isModal ? (
                <a
                  href="#"
                  className="sidebar-link-medical d-flex align-items-center"
                  onClick={(e) => item.modalType === 'rendezvous' ? handleModalClick(e, 'rendezvous') : handleMotDePasseClick(e)}
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

      {/* Modal de modification du mot de passe */}
      <ModifierMotDePasseModal
        show={showModifierMotDePasseModal}
        onHide={() => setShowModifierMotDePasseModal(false)}
      />

      {/* Modal de disponibilité médecin prescripteur */}
      <DisponibilitePrescriptuerModal
        show={showDisponibiliteModal}
        onHide={() => setShowDisponibiliteModal(false)}
      />
    </>
  );
}
