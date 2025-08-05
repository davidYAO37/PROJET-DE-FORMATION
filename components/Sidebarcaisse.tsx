'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { HouseDoorFill, ArrowRightCircleFill, PeopleFill, Clipboard2PulseFill, CalendarFill, Calendar2CheckFill, ClockFill, PencilSquare, KeyFill } from 'react-bootstrap-icons';

const menu = [
  { label: 'Tableau de bord', path: '/pages/servicecaisse/tcaisse', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Liste des Patients', path: '/pages/serviceacaisse/patient', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Patients en attente', path: '/transfert-patient', icon: <ArrowRightCircleFill size={24} className="me-2" /> },
  { label: 'Mes rendez-vous', path: '/transfert-patient', icon: <ArrowRightCircleFill size={24} className="me-2" /> },
  { label: 'Fiche prescription', path: '/salle-attente', icon: <PeopleFill size={24} className="me-2" /> },
  { label: 'Mon planning', path: '/constantes', icon: <Clipboard2PulseFill size={24} className="me-2" /> },
  { label: 'Mes comptes rendus', path: '/planning-medecin', icon: <CalendarFill size={24} className="me-2" /> },
  { label: 'Statistiques', path: '/disponibilite-medecin', icon: <Calendar2CheckFill size={24} className="me-2" /> },
  { label: 'Gérer mon Mot De Passe', path: '/mot-de-passe', icon: <KeyFill size={24} className="me-2" /> },
];

export default function Sidebarcaisse() {
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
