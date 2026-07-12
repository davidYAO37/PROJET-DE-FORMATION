'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Nav, Accordion } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';

const BASE = '/pages/servicecomptabilite';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  color: string;
  isMdp?: boolean;
}

interface MenuGroup {
  label: string;
  icon: string;
  color: string;
  items: MenuItem[];
}

const dashboard: MenuItem = { label: 'Tableau de bord', path: `${BASE}/tcompta`, icon: 'bi-speedometer2', color: 'text-primary' };

const menuGroups: MenuGroup[] = [
  {
    label: 'Gestion Caisse',
    icon: 'bi-cash-register',
    color: 'text-success',
    items: [
      { label: 'Caisse', path: `${BASE}/caisse`, icon: 'bi-cash-register', color: 'text-success' },
      { label: 'État des entrées', path: `${BASE}/etatentrees`, icon: 'bi-arrow-down-circle-fill', color: 'text-success' },
      { label: 'État des sorties', path: `${BASE}/etatsorties`, icon: 'bi-arrow-up-circle-fill', color: 'text-danger' },
    ],
  },
  {
    label: 'Bilan',
    icon: 'bi-bar-chart-fill',
    color: 'text-info',
    items: [
      { label: 'Bilan financier', path: `${BASE}/bilan`, icon: 'bi-bar-chart-fill', color: 'text-info' },
      { label: 'Budget de trésorerie', path: `${BASE}/budgettresorerie`, icon: 'bi-piggy-bank-fill', color: 'text-warning' },
      { label: 'Recette / Dépense', path: `${BASE}/recettedepense`, icon: 'bi-file-earmark-bar-graph-fill', color: 'text-primary' },
      { label: 'Débiteurs', path: `${BASE}/debiteurs`, icon: 'bi-people-fill', color: 'text-warning' },
      { label: 'Facturation assurances', path: `${BASE}/factureassurance`, icon: 'bi-shield-fill-check', color: 'text-danger' },
    ],
  },
  {
    label: 'Gestion Médecin',
    icon: 'bi-person-badge-fill',
    color: 'text-warning',
    items: [
      { label: 'Honoraires', path: `${BASE}/honoraires`, icon: 'bi-person-badge-fill', color: 'text-warning' },
      { label: 'Payé honoraire', path: `${BASE}/honoraires`, icon: 'bi-cash-coin', color: 'text-success' },
    ],
  },
  {
    label: 'Paramètres',
    icon: 'bi-gear-fill',
    color: 'text-secondary',
    items: [
      { label: 'Paramétrage opérations', path: `${BASE}/parametrageoperation`, icon: 'bi-gear-fill', color: 'text-warning' },
      { label: 'Mot de passe', path: '#', icon: 'bi-key-fill', color: 'text-secondary', isMdp: true },
    ],
  },
];

export default function SidebarComptabilite() {
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

        <div className="px-3 mb-2">
          <small className="text-white-50 text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
            Comptabilité
          </small>
        </div>
        <hr className="sidebar-separator-medical" />

        <Nav className="flex-column px-3">
          <Nav.Item className="mb-2">
            <Link
              href={dashboard.path}
              className={`sidebar-link-medical d-flex align-items-center ${pathname === dashboard.path || pathname.startsWith(dashboard.path + '/') ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <i className={`bi ${dashboard.icon} me-2 ${dashboard.color}`}></i>
              <span>{dashboard.label}</span>
            </Link>
          </Nav.Item>

          <Accordion
            alwaysOpen
            className="w-100"
            style={{
              '--bs-accordion-bg': 'transparent',
              '--bs-accordion-border-color': 'rgba(15,23,42,0.1)',
              '--bs-accordion-btn-bg': 'transparent',
              '--bs-accordion-active-bg': 'rgba(13,110,253,0.08)',
              '--bs-accordion-active-color': '#0d6efd',
              '--bs-accordion-btn-color': '#0f172a',
              '--bs-accordion-btn-focus-box-shadow': 'none'
            } as any}
            defaultActiveKey={menuGroups
              .map((g, idx) => g.items.some(item => pathname === item.path || pathname.startsWith(item.path + '/')) ? String(idx) : null)
              .filter((k): k is string => k !== null)}
          >
            {menuGroups.map((group, idx) => (
              <Accordion.Item eventKey={String(idx)} key={idx} style={{ background: 'transparent', borderColor: 'rgba(15,23,42,0.1)' }}>
                <Accordion.Header>
                  <i className={`bi ${group.icon} me-2 ${group.color}`} style={{ fontSize: '18px' }}></i>
                  {group.label}
                </Accordion.Header>
                <Accordion.Body className="ps-2" style={{ background: 'transparent' }}>
                  <Nav className="flex-column">
                    {group.items.map((item, i) => {
                      const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                      if (item.isMdp) {
                        return (
                          <Nav.Item key={i} className="mb-1">
                            <div
                              className={`sidebar-link-medical d-flex align-items-center ${isActive ? 'active' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setOpen(false); setShowMdp(true); }}
                            >
                              <i className={`bi ${item.icon} me-2 ${item.color}`}></i>
                              <span>{item.label}</span>
                            </div>
                          </Nav.Item>
                        );
                      }
                      return (
                        <Nav.Item key={i} className="mb-1">
                          <Link
                            href={item.path}
                            className={`sidebar-link-medical d-flex align-items-center ${isActive ? 'active' : ''}`}
                            onClick={() => setOpen(false)}
                          >
                            <i className={`bi ${item.icon} me-2 ${item.color}`}></i>
                            <span>{item.label}</span>
                          </Link>
                        </Nav.Item>
                      );
                    })}
                  </Nav>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
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
