'use client';

import { useState } from 'react';
import { Accordion, Button } from 'react-bootstrap';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ListePlanningModal from './ListePlanningModal';
import DisponibiliteMedecinModal from './DisponibiliteMedecinModal';
import { useAuthUser } from '@/hooks/useAuthUser';
import ListeAnnulationFactureModal from '@/app/pages/servicecaisse/componant/ListeAnnulationFactureModal';
import ListeAnnulationEncaissementModal from '@/app/pages/servicecaisse/componant/ListeAnnulationEncaissementModal';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';

export default function Sidebar() {
  const [showMenu, setShowMenu] = useState(false);
  const [showListeAnnulationModal, setShowListeAnnulationModal] = useState(false);
  const [showListeEncaissementAnnulationModal, setShowListeEncaissementAnnulationModal] = useState(false);
  const [showModifierMotDePasseModal, setShowModifierMotDePasseModal] = useState(false);
  const [showListePlanningModal, setShowListePlanningModal] = useState(false);
  const [showDisponibiliteModal, setShowDisponibiliteModal] = useState(false);
  const { user, loading } = useAuthUser();
  const pathname = usePathname();

  const handleListePlanningClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowListePlanningModal(true);
  };

  const handleDisponibiliteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDisponibiliteModal(true);
  };

  return (
    <>
      {/* Toggle menu (mobile only) */}
      <div className="d-md-none d-flex justify-content-between align-items-center bg-light p-2">
        <h5 className="m-0">Menu</h5>
        <Button variant="outline-primary" size="sm" onClick={() => setShowMenu(!showMenu)}>
          <i className={`bi ${showMenu ? 'bi-x' : 'bi-list'}`}></i>
        </Button>
      </div>
      {/* Sidebar moderne */}
      {/* Overlay mobile */}
      {showMenu && (
        <div className="sidebar-overlay-medical" onClick={() => setShowMenu(false)}></div>
      )}
      <aside
        className={`sidebar-medical sidebar-menu${showMenu ? ' open' : ''}`}
        onClick={e => {
          // N'empêche la propagation que si on clique sur le aside lui-même (pas sur les enfants)
          if (e.target === e.currentTarget) {
            e.stopPropagation();
          }
        }}
      >
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
        <ul className="nav flex-column gap-2">
          {/* Tableau de bord */}
          <li>
            <Link href="/dashboard" className="sidebar-link-medical d-flex align-items-center">
              <i className="bi bi-speedometer2 me-2 text-primary"></i>
              Tableau de bord
            </Link>
          </li>
        </ul>
        <Accordion alwaysOpen className="w-100 px-2">
          {/* Service accueil */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <i className="bi bi-people-fill me-2 text-primary" style={{ fontSize: '20px' }}></i>
              Service accueil
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/pages/serviceaccueil/tpatient" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-hospital me-2 text-info"></i> Gestion Accueil
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service Medecin */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              <i className="bi bi-person-badge-fill me-2 text-success" style={{ fontSize: '20px' }}></i>
              Service Médecin
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/pages/servicemedecin/tmedecin" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-person-fill-gear me-2 text-success"></i> Gestion Médecin
                  </Link>
                </li>
              </ul>
               <ul className="nav flex-column gap-2">
                <li>
                  <button
                    className="sidebar-link-medical d-flex align-items-center w-100 text-start border-0 bg-transparent"
                    onClick={handleListePlanningClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-calendar-check-fill me-2 text-primary"></i> Planning Médecin
                  </button>
                </li>
              </ul>
               <ul className="nav flex-column gap-2">
                <li>
                  <button
                    className="sidebar-link-medical d-flex align-items-center w-100 text-start border-0 bg-transparent"
                    onClick={handleDisponibiliteClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-clock-fill me-2 text-warning"></i> Disponibilité Médecin
                  </button>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service caisse */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              <i className="bi bi-cash-stack me-2 text-warning" style={{ fontSize: '20px' }}></i>
              Service caisse
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/pages/servicecaisse/tcaisse" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-cash-coin me-2 text-warning"></i> Gestion caisse
                  </Link>
                </li>
              </ul>
              <ul className="nav flex-column gap-2">
                <li>
                  <button
                    className="sidebar-link-medical d-flex align-items-center w-100 text-start border-0 bg-transparent"
                    onClick={() => setShowListeAnnulationModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i> Liste à annuler
                  </button>
                </li>
              </ul>
              <ul className="nav flex-column gap-2">
                <li>
                  <button
                    className="sidebar-link-medical d-flex align-items-center w-100 text-start border-0 bg-transparent"
                    onClick={() => setShowListeEncaissementAnnulationModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i> Encaissements à annuler
                  </button>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service comptabilité */}
          <Accordion.Item eventKey="3">
            <Accordion.Header>
              <i className="bi bi-calculator-fill me-2 text-secondary" style={{ fontSize: '20px' }}></i>
              Service comptabilité
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/compta/recettes" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-receipt me-2 text-secondary"></i> Gestion Comptabilité
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service pharmacie */}
          <Accordion.Item eventKey="4">
            <Accordion.Header>
              <i className="bi bi-capsule me-2 text-danger" style={{ fontSize: '20px' }}></i>
              Service Pharmacie
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/medecin/consultations" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-prescription2 me-2 text-danger"></i> Gestion Pharmacie
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service biologiste */}
          <Accordion.Item eventKey="5">
            <Accordion.Header>
              <i className="bi bi-microscope me-2 text-info" style={{ fontSize: '20px' }}></i>
              Service biologiste
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/biologiste/examens" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-clipboard2-pulse me-2 text-info"></i> Gestion Biologiste
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service laboratoire */}
          <Accordion.Item eventKey="6">
            <Accordion.Header>
              <i className="bi bi-virus me-2 text-primary" style={{ fontSize: '20px' }}></i>
              Service laboratoire
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/labo/prelevements" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-droplet me-2 text-primary"></i> Gestion Laboratoire
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service Infirmerie */}
          <Accordion.Item eventKey="7">
            <Accordion.Header>
              <i className="bi bi-heart-pulse-fill me-2 text-info" style={{ fontSize: '20px' }}></i>
              Service Infirmerie
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/labo/prelevements" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-bandaid me-2 text-info"></i> Gestion Infirmerie
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Paramètre utilisateur */}
          <Accordion.Item eventKey="8">
            <Accordion.Header>
              <i className="bi bi-gear-fill me-2 text-dark" style={{ fontSize: '22px' }}></i>
              Paramètres
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  {!loading && user ? (
                    user.type === 'adminsuper' ? (
                      <Link href="/signupdev" className="sidebar-link-medical d-flex align-items-center">
                        <i className="bi bi-person-plus-fill me-2 text-dark"></i> Utilisateurs
                      </Link>
                    ) : (
                      <Link href="/signup" className="sidebar-link-medical d-flex align-items-center">
                        <i className="bi bi-person-plus-fill me-2 text-dark"></i> Utilisateurs
                      </Link>
                    )
                  ) : (
                    <Link href="/signup" className="sidebar-link-medical d-flex align-items-center">
                      <i className="bi bi-person-plus-fill me-2 text-dark"></i> Utilisateurs
                    </Link>
                  )}
                </li>
                <li>
                  <Link href="/dashboard/parametres/medecin" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-person-badge-fill me-2 text-success"></i> Medecins
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/assurances" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-shield-check me-2 text-primary"></i> Assurances
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/actes" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-clipboard2-medical me-2 text-primary"></i> Actes Cliniques
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/Typeacte" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-tags-fill me-2 text-primary"></i> Type d'actes
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/familleacte" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-tag-fill me-2 text-primary"></i> Famille d'actes
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/medicaments" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-capsule-fill me-2 text-primary"></i> Liste medicaments
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/medicamentachat" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-cart-check-fill me-2 text-primary"></i> Gestion Achats
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/modepaiement" className="sidebar-link-medical d-flex align-items-center">
                    <i className="bi bi-credit-card-fill me-2 text-primary"></i> Mode Paiement
                  </Link>
                </li>
                <li>
                  <button
                    className="sidebar-link-medical d-flex align-items-center w-100 text-start border-0 bg-transparent"
                    onClick={() => setShowModifierMotDePasseModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-key-fill me-2 text-primary"></i> Mot de passe
                  </button>
                </li>
                {!loading && user && user.type === 'adminsuper' && (
                  <li>
                    <Link href="/dashboard/parametres/entreprise" className="sidebar-link-medical d-flex align-items-center">
                      <i className="bi bi-building me-2 text-primary"></i> Gestion entreprise
                    </Link>
                  </li>
                )}
              </ul>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </aside>

      {/* Modal pour la liste des annulations de factures */}
      <ListeAnnulationFactureModal
        show={showListeAnnulationModal}
        onHide={() => setShowListeAnnulationModal(false)}
      />
      
      {/* Modal pour la liste des annulations d'encaissements */}
      <ListeAnnulationEncaissementModal
        show={showListeEncaissementAnnulationModal}
        onHide={() => setShowListeEncaissementAnnulationModal(false)}
      />
      
      {/* Modal pour modifier le mot de passe */}
      <ModifierMotDePasseModal
        show={showModifierMotDePasseModal}
        onHide={() => setShowModifierMotDePasseModal(false)}
      />

      {/* Modal pour la liste des plannings */}
      <ListePlanningModal
        show={showListePlanningModal}
        onHide={() => setShowListePlanningModal(false)}
      />

      {/* Modal pour les disponibilités médecin */}
      <DisponibiliteMedecinModal
        show={showDisponibiliteModal}
        onHide={() => setShowDisponibiliteModal(false)}
      />
    </>
  );
}