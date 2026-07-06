'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';
import { useRouter } from 'next/navigation';

const menu = [
  { label: 'Tableau de bord',      path: '/pages/serviceinfirmier/tinfirmier',                    icon: <i className="bi bi-speedometer2 me-2 text-info"></i> },
  { label: 'Liste des patients',   path: '/pages/serviceinfirmier/tinfirmier',                    icon: <i className="bi bi-people-fill me-2 text-primary"></i> },
  { label: 'Patients hospitalisés', path: '/pages/serviceinfirmier/tinfirmier/patientsHospitalises', icon: <i className="bi bi-hospital me-2 text-warning"></i> },
  { label: 'Prescriptions',        path: '/pages/serviceinfirmier/tinfirmier/prescriptions',        icon: <i className="bi bi-capsule me-2 text-success"></i> },
  { label: 'Planning des soins',   path: '/pages/serviceinfirmier/tinfirmier/planning-soins',      icon: <i className="bi bi-calendar-check me-2 text-info"></i> },
  { label: 'Mot de passe',         path: '#', isModal: true,                                      icon: <i className="bi bi-key-fill me-2 text-dark"></i> },
];

export default function SidebarInfirmier() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen]   = useState(false);
  const [user, setUser]   = useState('');
  const [showMotDePasseModal, setShowMotDePasseModal] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('nom_utilisateur') || '';
    setUser(storedUser);
  }, []);

  const handleLinkClick = () => setOpen(false);

  const handleMotDePasseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMotDePasseModal(true);
    setOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/connexion');
  };

  return (
    <>
      {/* Burger mobile */}
      <button
        className="sidebar-burger-medical d-md-none"
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
            <rect x="20" y="8"  width="8"  height="32" rx="4" fill="#fff" />
            <rect x="8"  y="20" width="32" height="8"  rx="4" fill="#fff" />
            <rect x="22" y="10" width="4"  height="28" rx="2" fill="#0dcaf0" />
            <rect x="10" y="22" width="28" height="4"  rx="2" fill="#0dcaf0" />
          </svg>
          <span className="sidebar-title-medical ms-2">EasyMedical</span>
        </div>

        {user && (
          <div className="px-3 mb-3">
            <small className="text-white-50">Connecté(e) en tant que</small>
            <div className="fw-bold text-white" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-person-badge-fill me-1 text-info"></i>
              {user}
            </div>
            <div>
              <small className="text-white-50">Infirmier(e)</small>
            </div>
          </div>
        )}

        <hr className="sidebar-separator-medical" />

        <Nav className="flex-column px-3">
          {menu.map((item, index) => (
            <Nav.Item key={index} className="mb-2">
              {item.isModal ? (
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
        </Nav>
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
        show={showMotDePasseModal}
        onHide={() => setShowMotDePasseModal(false)}
      />
    </>
  );
}
