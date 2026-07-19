'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';

const BASE = '/pages/servicefacturation';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  color: string;
  isMdp?: boolean;
}

const menu: MenuItem[] = [
  { label: 'Tableau de bord', path: `${BASE}/tfacturation`, icon: 'bi-speedometer2', color: 'text-primary' },
  { label: 'Honoraires Médecins', path: `${BASE}/honoraires`, icon: 'bi-person-badge-fill', color: 'text-warning' },
  { label: 'Facturation assurances', path: `${BASE}/factureassurance`, icon: 'bi-shield-fill-check', color: 'text-danger' },
  { label: 'Mot de passe', path: '#', icon: 'bi-key-fill', color: 'text-secondary', isMdp: true },
];

export default function SidebarFacturation() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState('');
  const [showMdp, setShowMdp] = useState(false);

  useEffect(() => {
    setUser(localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '');
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/connexion');
  };

  const handleLinkClick = () => setOpen(false);

  return (
    <>
      {/* Burger mobile */}
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
        {/* Logo */}
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

        {/* Titre section */}
        <div className="px-3 mb-2">
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2 }}>
            Service Facturation
          </span>
        </div>

        <Nav className="flex-column px-3">
          {menu.map((item, index) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Nav.Item key={index} className="mb-2">
                {item.isMdp ? (
                  <div
                    className="sidebar-link-medical d-flex align-items-center"
                    onClick={() => { setOpen(false); setShowMdp(true); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className={`bi ${item.icon} me-2 ${item.color}`}></i>
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    className={`sidebar-link-medical d-flex align-items-center ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <i className={`bi ${item.icon} me-2 ${item.color}`}></i>
                    <span>{item.label}</span>
                  </Link>
                )}
              </Nav.Item>
            );
          })}
        </Nav>

        <div className="mt-auto px-3 pb-3">
          {user && (
            <div className="text-white-50 small mb-2 px-1">
              <i className="bi bi-person-circle me-1"></i>{user}
            </div>
          )}
          <button
            className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <ModifierMotDePasseModal show={showMdp} onHide={() => setShowMdp(false)} />
    </>
  );
}
