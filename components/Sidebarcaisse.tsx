'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import ExamenHospitalisationModalCaisse from '@/app/pages/servicecaisse/componant/FactureExamHospit/ExamenHospitModalCaisse';
import PharmacieCaisseModal from '@/app/pages/servicecaisse/componant/PharmacieCaisse/PharmacieCaisseModal';
import FacturesNonSoldesModal from '@/app/pages/servicecaisse/componant/FacturesNonSoldesModal';
import PointCaisseModal from '@/app/pages/servicecaisse/componant/PointCaisseModal';
import ListeEncaissementModal from '@/app/pages/servicecaisse/componant/ListeEncaissementModal';
import MenuImpressionFactureModal from '@/app/pages/servicecaisse/componant/MenuImpressionFactureModal';


const menu = [
  { label: 'Tableau de bord', path: '/pages/servicecaisse/tcaisse', icon: <i className="bi bi-speedometer2 me-2 text-primary"></i> },
  { label: 'Factures en attente', path: '/pages/servicecaisse/listefactures', icon: <i className="bi bi-house-door-fill me-2 text-success"></i> },
  { label: 'Saisir une Facture Exam-Hospit...', path: '#', isModal: true, icon: <i className="bi bi-arrow-right-circle-fill me-2 text-info"></i>, style: { cursor: 'pointer' } },
  { label: 'Facturer une pharmacie', path: '#', isModal: true, icon: <i className="bi bi-arrow-right-circle-fill me-2 text-warning"></i>, style: { cursor: 'pointer' } },
  { label: 'Facture à solder', path: '#', isModal: true, icon: <i className="bi bi-clipboard2-pulse-fill me-2 text-danger"></i>, style: { cursor: 'pointer' } },
  { label: 'Point de caisse', path: '#', isModal: true, icon: <i className="bi bi-cash-stack me-2 text-success"></i>, style: { cursor: 'pointer' } },
  { label: 'Liste encaissement', path: '#', isModal: true, icon: <i className="bi bi-card-list me-2 text-info"></i>, style: { cursor: 'pointer' } },
  { label: 'Imprimer Facture', path: '#', isModal: true, icon: <i className="bi bi-printer-fill me-2 text-primary"></i>, style: { cursor: 'pointer' } },
  { label: 'Mot de passe', path: '/salle-attente', icon: <i className="bi bi-people-fill me-2 text-secondary"></i> },
];

export default function Sidebarcaisse() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState('');
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [showPaiementPharmacieModal, setShowPaiementPharmacieModal] = useState(false);
  const [showFacturesNonSoldesModal, setShowFacturesNonSoldesModal] = useState(false);
  const [showPointCaisseModal, setShowPointCaisseModal] = useState(false);
  const [showListeEncaissementModal, setShowListeEncaissementModal] = useState(false);
  const [showMenuImpressionModal, setShowMenuImpressionModal] = useState(false);
  const [facturesEnAttenteCount, setFacturesEnAttenteCount] = useState(0);


  // Charger l'utilisateur connecté au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
    setUser(storedUser);
  }, []);

  // Charger le nombre de factures en attente
  useEffect(() => {
    const fetchFacturesEnAttente = async () => {
      try {
        // Récupérer les consultations en attente
        const consultRes = await fetch('/api/consultationFacture/consultAttentePaiement');
        const consultations = consultRes.ok ? await consultRes.json() : [];

        // Récupérer les prestations en attente
        const prestRes = await fetch('/api/consultationFacture/prestationAttentePaiement');
        const prestations = prestRes.ok ? await prestRes.json() : [];

        // Récupérer les prescriptions en attente
        const prescRes = await fetch('/api/consultationFacture/prescriptionAttentePaiement');
        const prescriptions = prescRes.ok ? await prescRes.json() : [];

        // Calculer le total
        const totalCount =
          (Array.isArray(consultations) ? consultations.length : 0) +
          (Array.isArray(prestations) ? prestations.length : 0) +
          (Array.isArray(prescriptions) ? prescriptions.length : 0);

        setFacturesEnAttenteCount(totalCount);
      } catch (error) {
        console.error('Erreur lors du chargement des factures en attente:', error);
        setFacturesEnAttenteCount(0);
      }
    };

    fetchFacturesEnAttente();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchFacturesEnAttente, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fonction de rechargement locale pour la sidebar
  const rechargerCompteursLocaux = async () => {
    try {
      // Récupérer les consultations en attente
      const consultRes = await fetch('/api/consultationFacture/consultAttentePaiement');
      const consultations = consultRes.ok ? await consultRes.json() : [];

      // Récupérer les prestations en attente
      const prestRes = await fetch('/api/consultationFacture/prestationAttentePaiement');
      const prestations = prestRes.ok ? await prestRes.json() : [];

      // Récupérer les prescriptions en attente
      const prescRes = await fetch('/api/consultationFacture/prescriptionAttentePaiement');
      const prescriptions = prescRes.ok ? await prescRes.json() : [];

      // Calculer le total
      const totalCount =
        (Array.isArray(consultations) ? consultations.length : 0) +
        (Array.isArray(prestations) ? prestations.length : 0) +
        (Array.isArray(prescriptions) ? prescriptions.length : 0);

      setFacturesEnAttenteCount(totalCount);

      // Appeler la fonction globale si elle existe (pour la page tcaisse)
      if (typeof window !== 'undefined' && (window as any).rechargerCompteursCaisse) {
        (window as any).rechargerCompteursCaisse();
      }
    } catch (error) {
      console.error('Erreur lors du rechargement des compteurs:', error);
    }
  };


  // Ferme la sidebar quand on clique sur un lien (mobile)
  const handleLinkClick = () => {
    setOpen(false);
    // Recharger les compteurs locaux de la sidebar
    rechargerCompteursLocaux();
  };

  // ouvre le modal de saisir une facture et ferme la sidebar en mobile
  const handleFactureClick = () => {
    setShowFactureModal(true);
    setOpen(false);
  };

  // ouvre le modal de saisir une facture de pharmacie et ferme la sidebar en mobile
  const handlePaiementPharmacieClick = () => {
    setShowPaiementPharmacieModal(true);
    setOpen(false);
  };

  // ouvre le modal des factures non soldées et ferme la sidebar en mobile
  const handleFacturesNonSoldesClick = () => {
    setShowFacturesNonSoldesModal(true);
    setOpen(false);
  };

  // ouvre le modal Point de caisse et ferme la sidebar en mobile
  const handlePointCaisseClick = () => {
    setShowPointCaisseModal(true);
    setOpen(false);
  };

  // ouvre le modal Liste encaissement et ferme la sidebar en mobile
  const handleListeEncaissementClick = () => {
    setShowListeEncaissementModal(true);
    setOpen(false);
  };

  // ouvre le modal Menu Impression Facture et ferme la sidebar en mobile
  const handleMenuImpressionClick = () => {
    setShowMenuImpressionModal(true);
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
            <Nav.Item key={index} className="mb-2" style={{ cursor: 'pointer' }}>
              {item.isModal ? (
                <div
                  className={`sidebar-link-medical d-flex align-items-center ${pathname === item.path ? 'active' : ''} cursor-pointer`}
                  onClick={
                    item.label === 'Facturer une pharmacie'
                      ? handlePaiementPharmacieClick
                      : item.label === 'Facture à solder'
                        ? handleFacturesNonSoldesClick
                        : item.label === 'Point de caisse'
                          ? handlePointCaisseClick
                          : item.label === 'Liste encaissement'
                            ? handleListeEncaissementClick
                            : item.label === 'Imprimer Facture'
                              ? handleMenuImpressionClick
                              : handleFactureClick
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
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
                  {item.label === 'Factures en attente' && facturesEnAttenteCount > 0 && (
                    <span className="badge bg-danger text-white rounded-pill ms-2">
                      {facturesEnAttenteCount}
                    </span>
                  )}
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

      {/* Modal pour le paiement de pharmacie */}
      <PharmacieCaisseModal
        show={showPaiementPharmacieModal}
        onHide={() => setShowPaiementPharmacieModal(false)}
      />

      {/* Modal pour les factures non soldées */}
      <FacturesNonSoldesModal
        show={showFacturesNonSoldesModal}
        onHide={() => setShowFacturesNonSoldesModal(false)}
      />

      {/* Modal pour le point de caisse */}
      <PointCaisseModal
        show={showPointCaisseModal}
        onHide={() => setShowPointCaisseModal(false)}
      />

      {/* Modal pour la liste des encaissements */}
      <ListeEncaissementModal
        show={showListeEncaissementModal}
        onHide={() => setShowListeEncaissementModal(false)}
      />

      {/* Modal pour le menu impression facture */}
      <MenuImpressionFactureModal
        show={showMenuImpressionModal}
        onHide={() => setShowMenuImpressionModal(false)}
      />

    </>
  );
}