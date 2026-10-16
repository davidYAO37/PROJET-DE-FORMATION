'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import ParametrageEntryLink from '@/components/ParametrageEntryLink';
import AutresServicesLinks from '@/components/AutresServicesLinks';
import { useRouter } from 'next/navigation';
import SidebarBlockOverlay from '@/components/licence/SidebarBlockOverlay';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';

interface MenuLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  isModal?: boolean;
}

interface MenuGroup {
  label: string;
  children: MenuLink[];
}

type MenuItem = MenuLink | MenuGroup;

function isMenuGroup(item: MenuItem): item is MenuGroup {
  return 'children' in item && Array.isArray((item as MenuGroup).children);
}

const menu: MenuItem[] = [
  { label: 'Tableau de bord', path: '/pages/serviceaccueilcaisse/taccueilcaisse', icon: <i className="bi bi-speedometer2 me-2 text-primary"></i> },
  {
    label: 'Service Accueil',
    children: [
      { label: 'Accueil Patient', path: '/pages/serviceaccueil/patient', icon: <i className="bi bi-house-door-fill me-2 text-success"></i> },
      { label: 'Statistiques', path: '/pages/serviceaccueil/statistiques', icon: <i className="bi bi-bar-chart-fill me-2 text-info"></i> },
      { label: 'Statistiques RDV', path: '/pages/statistiques-rendezvous', icon: <i className="bi bi-calendar-event-fill me-2 text-info"></i> },
    ],
  },
  {
    label: 'Service Caisse',
    children: [
      { label: 'Gestion Caisse', path: '/pages/servicecaisse/tcaisse', icon: <i className="bi bi-cash-coin me-2 text-warning"></i> },
      { label: 'Compte patient', path: '/pages/servicecaisse/comptePatient', icon: <i className="bi bi-wallet-fill me-2 text-success"></i> },
      { label: 'Factures en attente', path: '/pages/servicecaisse/listefactures', icon: <i className="bi bi-house-door-fill me-2 text-success"></i> },
      { label: 'Patient caisse', path: '/pages/servicecaisse/patientcaisse', icon: <i className="bi bi-people-fill me-2 text-primary"></i> },
    ],
  },
  { label: 'Guide d\'utilisation', path: '/pages/serviceaccueil/guide', icon: <i className="bi bi-book-half me-2 text-primary"></i> },
  { label: 'Mot de passe', path: '#', isModal: true, icon: <i className="bi bi-key-fill me-2 text-dark"></i> },
];

export default function SidebarAccueilCaisse() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showModifierMotDePasseModal, setShowModifierMotDePasseModal] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Service Accueil': true,
    'Service Caisse': true,
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLinkClick = () => setOpen(false);

  const handleMotDePasseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModifierMotDePasseModal(true);
    setOpen(false);
  };

  const toggleGroup = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/connexion');
  };

  return (
    <>
      <button
        className="sidebar-burger-medical d-lg-none"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
      >
        <span className="sidebar-burger-bar"></span>
        <span className="sidebar-burger-bar"></span>
        <span className="sidebar-burger-bar"></span>
      </button>

      {open && <div className="sidebar-overlay-medical" onClick={() => setOpen(false)}></div>}

      <aside className={`sidebar-medical${open ? ' open' : ''}`}>
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
        <SidebarBlockOverlay module="accueil">
          <Nav className="flex-column px-3">
            {menu.map((item, index) => (
              <Nav.Item key={index} className="mb-2">
                {isMenuGroup(item) ? (
                  <div>
                    <button
                      className="sidebar-link-medical d-flex align-items-center w-100 text-start border-0 bg-transparent"
                      onClick={() => toggleGroup(item.label)}
                      style={{ cursor: 'pointer' }}
                    >
                      <i
                        className={`bi me-2 ${
                          item.label === 'Service Accueil' ? 'bi-people-fill text-info' : 'bi-cash-stack text-warning'
                        }`}
                        style={{ fontSize: '20px' }}
                      ></i>
                      <span>{item.label}</span>
                      <i
                        className={`bi ms-auto ${expanded[item.label] ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                      ></i>
                    </button>
                    {expanded[item.label] && (
                      <div className="ps-4 mt-2">
                        {item.children.map((child, childIndex) => (
                          <Link
                            key={childIndex}
                            href={child.path}
                            className={`sidebar-link-medical d-flex align-items-center mb-2 ${pathname === child.path ? 'active' : ''}`}
                            onClick={handleLinkClick}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : item.isModal ? (
                  <a
                    href="#"
                    className="sidebar-link-medical d-flex align-items-center"
                    onClick={handleMotDePasseClick}
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
            <Nav.Item className="mb-2">
              <ParametrageEntryLink />
              <AutresServicesLinks current={["accueil", "caisse"]} />
            </Nav.Item>
          </Nav>
        </SidebarBlockOverlay>
        <div className="mt-auto px-3 pb-3">
          <button
            className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <ModifierMotDePasseModal
        show={showModifierMotDePasseModal}
        onHide={() => setShowModifierMotDePasseModal(false)}
      />
    </>
  );
}
