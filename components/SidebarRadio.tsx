'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Nav, Badge } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';
import DisponibilitePrescriptuerModalRadio from '@/app/pages/serviceradio/tradio/composants/DisponibilitePrescripteurModalRadio';

interface Statistiques {
  patientsEnAttente: number;
  rendezVousDuJour: number;
}

const menu = [
  { label: 'Tableau de bord', path: '/pages/serviceradio/tradio', icon: <i className="bi bi-speedometer2 me-2 text-primary"></i> },
  { label: 'Mes Rendez-Vous', path: '#', isModal: true, modalType: 'rendezvous', icon: <i className="bi bi-calendar-check-fill me-2 text-success"></i>, showNotification: true, notificationKey: 'rendezVousDuJour' },
  { label: 'Mot de passe', path: '#', isModal: true, icon: <i className="bi bi-key-fill me-2 text-dark"></i> },
];

export default function SidebarRadio() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showDisponibiliteModalRadio, setShowDisponibiliteModalRadio] = useState(false);
  const [showModifierMotDePasseModal, setShowModifierMotDePasseModal] = useState(false);
  const [user, setUser] = useState('');
  const [statistiques, setStatistiques] = useState<Statistiques>({
    patientsEnAttente: 0,
    rendezVousDuJour: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
    setUser(storedUser);
  }, []);

  // Récupérer les statistiques pour les notifications
  useEffect(() => {
    const fetchStatistiques = async () => {
      try {
        // Essayer de récupérer les données depuis l'API Avalider
        const response = await fetch('/api/compteRenduRadio/Avalider');
        if (response.ok) {
          const data = await response.json();
          setStatistiques({
            patientsEnAttente: data.lignePrestations?.length || 0,
            rendezVousDuJour: 0
          });
        } else {
          // Si l'API n'est pas accessible, utiliser des valeurs par défaut
          setStatistiques({
            patientsEnAttente: 0,
            rendezVousDuJour: 0
          });
        }
      } catch (error) {
        // En cas d'erreur réseau ou autre, utiliser des valeurs par défaut
        console.warn('API non accessible, utilisation des valeurs par défaut:', error);
        setStatistiques({
          patientsEnAttente: 0,
          rendezVousDuJour: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistiques();
    // Rafraîchir les statistiques toutes les 30 secondes
    const interval = setInterval(fetchStatistiques, 30000);
    return () => clearInterval(interval);
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
    setShowDisponibiliteModalRadio(true);
    setOpen(false);
  };
   // Gestionnaire pour les clics sur les modaux
  const handleModalClick = (e: React.MouseEvent, modalType: string) => {
    e.preventDefault();
    if (modalType === 'rendezvous') {
      setShowDisponibiliteModalRadio(true);
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
                  className="sidebar-link-medical d-flex align-items-center justify-content-between"
                  onClick={(e) => {
                    if (item.modalType === 'rendezvous') {
                      handleModalClick(e, 'rendezvous');
                    } else {
                      handleMotDePasseClick(e);
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.showNotification && (
                    <Badge bg="danger" pill className="notification-badge-medical">
                      {statistiques[item.notificationKey as keyof Statistiques]}
                    </Badge>
                  )}
                </a>
              ) : (
                <Link
                  href={item.path}
                  className={`sidebar-link-medical d-flex align-items-center justify-content-between ${pathname === item.path ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  <div className="d-flex align-items-center">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
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
      
      {/* Modal de disponibilité du médecin */}
      <DisponibilitePrescriptuerModalRadio
        show={showDisponibiliteModalRadio}
        onHide={() => setShowDisponibiliteModalRadio(false)}
      />
    </>
  );
}
