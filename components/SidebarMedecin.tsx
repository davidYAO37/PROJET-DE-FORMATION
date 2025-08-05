'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { HouseDoorFill, PeopleFill, ClockFill, CalendarCheckFill, FileEarmarkTextFill, CalendarFill, ClipboardCheckFill, BarChartFill, KeyFill } from 'react-bootstrap-icons';

const menu = [
  { label: 'Tableau de bord', path: '/pages/servicemedecin/tmedecin', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Liste des patients', path: '/pages/servicemedecin/patient', icon: <PeopleFill size={24} className="me-2" /> },
  { label: 'Patient en attente', path: '/transfert-patient', icon: <ClockFill size={24} className="me-2" /> },
  { label: 'Mes Rendez-Vous', path: '/salle-attente', icon: <CalendarCheckFill size={24} className="me-2" /> },
  { label: 'Saisir fiche prescription', path: '/constantes', icon: <FileEarmarkTextFill size={24} className="me-2" /> },
  { label: 'Planning Médecin', path: '/planning-medecin', icon: <CalendarFill size={24} className="me-2" /> },
  { label: 'Mon planning', path: '/disponibilite-medecin', icon: <ClipboardCheckFill size={24} className="me-2" /> },
  { label: 'Mes comptes rendus', path: '/rendez-vous', icon: <FileEarmarkTextFill size={24} className="me-2" /> },
  { label: 'Statistiques', path: '/point-saisie', icon: <BarChartFill size={24} className="me-2" /> },
  { label: 'Gérer mon Mot De Passe', path: '/mot-de-passe', icon: <KeyFill size={24} className="me-2" /> },
];

export default function SidebarMedecin() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-medical">
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
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </Nav.Item>
        ))}
      </Nav>
    </aside>
  );
}
