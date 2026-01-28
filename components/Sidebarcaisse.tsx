'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { HouseDoorFill, ArrowRightCircleFill, PeopleFill, Clipboard2PulseFill, CalendarFill, Calendar2CheckFill, ClockFill, PencilSquare, KeyFill } from 'react-bootstrap-icons';
import { useEffect, useState } from 'react';
import ExamenHospitalisationModalCaisse from '@/app/pages/servicecaisse/componant/FactureExamHospit/ExamenHospitModalCaisse';
import PaiementPharmacieModal from '@/app/pages/servicecaisse/componant/PharmacieCaisse/PaiementPharmacieModal';

const menu = [
  { label: 'Tableau de bord', path: '/pages/servicecaisse/tcaisse', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Factures en attente', path: '/pages/servicecaisse/listefactures', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Saisir une Facture Exam-Hospit...', path: '#', isModal: true, icon: <ArrowRightCircleFill size={24} className="me-2" />, style: { cursor: 'pointer' } },
  { label: 'Facturer une pharmacie', path: '#', isModal: true, icon: <ArrowRightCircleFill size={24} className="me-2" />, style: { cursor: 'pointer' } },
  { label: 'Caution Patient', path: '/salle-attente', icon: <PeopleFill size={24} className="me-2" /> },
  { label: 'Facture a solder', path: '/constantes', icon: <Clipboard2PulseFill size={24} className="me-2" /> },
  { label: 'Imprimer Facture', path: '/planning-medecin', icon: <CalendarFill size={24} className="me-2" /> },
];

export default function Sidebarcaisse() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState('');
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [showPaiementPharmacieModal, setShowPaiementPharmacieModal] = useState(false);


  // Charger l'utilisateur connecté au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
    setUser(storedUser);
  }, []);


  // ferme la sidebar quand on clique sur un lien (mobile)
  const handleLinkClick = () => setOpen(false);


  // ouvre le modal de saisir une facture
  const handleFactureClick = () => setShowFactureModal(true);

  // ouvre le modal de saisir une facture de pharmacie
  const handlePaiementPharmacieClick = () => setShowPaiementPharmacieModal(true);

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
            <Nav.Item key={index} className="mb-2" style={{ cursor: 'pointer' }}>
              {item.isModal ? (
                <div
                  className={`sidebar-link-medical d-flex align-items-center ${pathname === item.path ? 'active' : ''} cursor-pointer`}
                  onClick={item.label === 'Facturer une pharmacie' ? handlePaiementPharmacieClick : handleFactureClick}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={`sidebar-link-medical d-flex align-items-center ${pathname === item.path ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </Nav.Item>
          ))}
        </Nav>
      </aside>

      {/* Modal pour la saisie de facture */}
      <ExamenHospitalisationModalCaisse
        show={showFactureModal}
        onHide={() => setShowFactureModal(false)}
      />

      {/* Modal pour la saisie de facture de pharmacie */}
      <PaiementPharmacieModal
        show={showPaiementPharmacieModal}
        onHide={() => setShowPaiementPharmacieModal(false)}
      />

    </>
  );
}


/* 'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { HouseDoorFill, ArrowRightCircleFill, PeopleFill, Clipboard2PulseFill, CalendarFill, Calendar2CheckFill, ClockFill, PencilSquare, KeyFill } from 'react-bootstrap-icons';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Chargement dynamique du modal avec désactivation du SSR
const ExamenHospitalisationModalCaisse = dynamic(
  () => import('../app/pages/servicecaisse/componant/FactureExamHospit/ExamenHospitModalCaisse'),
  { ssr: false, loading: () => <div>Chargement du formulaire...</div> }
);

const menu = [
  { label: 'Tableau de bord', path: '/pages/servicecaisse/tcaisse', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Factures en attente', path: '/pages/servicecaisse/listefactures', icon: <HouseDoorFill size={24} className="me-2" /> },
  { label: 'Saisir de Facture Exam-Hospit...', path:'#' , isModal: true, icon: <ArrowRightCircleFill size={24} className="me-2"/> },
  { label: 'Facturer une pharmacie', path: '/transfert-patient', icon: <ArrowRightCircleFill size={24} className="me-2" /> },
  { label: 'Caution Patient', path: '/salle-attente', icon: <PeopleFill size={24} className="me-2" /> },
  { label: 'Facture a solder', path: '/constantes', icon: <Clipboard2PulseFill size={24} className="me-2" /> },
  { label: 'Imprimer Facture', path: '/planning-medecin', icon: <CalendarFill size={24} className="me-2" /> },
];

export default function Sidebarcaisse() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState('');
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);


  // Charger l'utilisateur connecté au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
    setUser(storedUser);
  }, []);


  // ferme la sidebar quand on clique sur un lien (mobile)
  const handleLinkClick = () => setOpen(false);

  // Gestion de l'ouverture/fermeture du modal
  const handleFactureClick = () => {
    // Créer un nouvel élément pour le mode création
    const newItem = {
      type: 'PRESTATION',
      code: '',
      patient: '',
      designation: 'Examen d\'hospitalisation',
      montant: 0,
      medecin: '',
      assure: '',
      raw: {}
    };
    setSelectedItem(newItem);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      
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
                <div 
                  className={`sidebar-link-medical d-flex align-items-center ${pathname === item.path ? 'active' : ''} cursor-pointer`}
                  onClick={handleFactureClick}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={`sidebar-link-medical d-flex align-items-center ${pathname === item.path ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </Nav.Item>
          ))}
        </Nav>
      </aside>
      
      
      {selectedItem?.type === 'PRESTATION' && (
        <ExamenHospitalisationModalCaisse
          show={modalOpen}
          onHide={handleCloseModal}
          CodePrestation={selectedItem?.raw?.CodePrestation || ''}
          Designationtypeacte={selectedItem?.designation || ''}
          PatientP={selectedItem?.patient || ''}
          examenHospitId={selectedItem?.id || ''}
          dateEntree={null}
          dateSortie={null}
          nombreDeJours={1}
          renseignementclinique=""
        />
      )}
    </>
  );
}
*/