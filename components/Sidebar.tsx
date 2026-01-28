'use client';

import Link from 'next/link';
import { Accordion, Button } from 'react-bootstrap';
import { useState } from 'react';
import { GiBoneGnawer } from 'react-icons/gi';
import { IoIosSettings } from 'react-icons/io';
import { MdBiotech, MdLocalPharmacy } from 'react-icons/md';
import { BiSolidCalculator, BiSolidUserCircle } from 'react-icons/bi';
import { FaCashRegister, FaUserDoctor, FaUserNurse, FaUserPlus, FaUserShield } from 'react-icons/fa6';
import { LiaChessBishopSolid } from 'react-icons/lia';

export default function Sidebar() {
  const [showMenu, setShowMenu] = useState(false);

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
              Tableau de bord
            </Link>
          </li>
        </ul>
        <Accordion alwaysOpen className="w-100 px-2">
          {/* Service accueil */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <BiSolidUserCircle className="me-2 text-primary" size={22} />
              Service accueil
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/pages/serviceaccueil/tpatient" className="sidebar-link-medical d-flex align-items-center">
                    <GiBoneGnawer className="me-2 text-info" /> Gestion Accueil
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service Medecin */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              <FaUserDoctor className="me-2 text-success" size={20} />
              Service Médecin
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/pages/servicemedecin/tmedecin" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserDoctor className="me-2 text-success" /> Gestion Médecin
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service caisse */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              <FaCashRegister className="me-2 text-warning" size={20} />
              Service caisse
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/pages/servicecaisse/tcaisse" className="sidebar-link-medical d-flex align-items-center">
                    <FaCashRegister className="me-2 text-warning" /> Gestion caisse
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service comptabilité */}
          <Accordion.Item eventKey="3">
            <Accordion.Header>
              <BiSolidCalculator className="me-2 text-secondary" size={20} />
              Service comptabilité
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/compta/recettes" className="sidebar-link-medical d-flex align-items-center">
                    <BiSolidCalculator className="me-2 text-secondary" /> Gestion Comptabilité
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service pharmacie */}
          <Accordion.Item eventKey="4">
            <Accordion.Header>
              <MdLocalPharmacy className="me-2 text-danger" size={20} />
              Service Pharmacie
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/medecin/consultations" className="sidebar-link-medical d-flex align-items-center">
                    <MdLocalPharmacy className="me-2 text-danger" /> Gestion Pharmacie
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service biologiste */}
          <Accordion.Item eventKey="5">
            <Accordion.Header>
              <MdBiotech className="me-2 text-info" size={20} />
              Service biologiste
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/biologiste/examens" className="sidebar-link-medical d-flex align-items-center">
                    <MdBiotech className="me-2 text-info" /> Gestion Biologiste
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service laboratoire */}
          <Accordion.Item eventKey="6">
            <Accordion.Header>
              <LiaChessBishopSolid className="me-2 text-primary" size={20} />
              Service laboratoire
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/labo/prelevements" className="sidebar-link-medical d-flex align-items-center">
                    <LiaChessBishopSolid className="me-2 text-primary" /> Gestion Laboratoire
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Service Infirmerie */}
          <Accordion.Item eventKey="7">
            <Accordion.Header>
              <FaUserNurse className="me-2 text-info" size={20} />
              Service Infirmerie
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/labo/prelevements" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserNurse className="me-2 text-info" /> Gestion Infirmerie
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          {/* Paramètre utilisateur */}
          <Accordion.Item eventKey="8">
            <Accordion.Header>
              <IoIosSettings className='me-2 text-dark' size={22} />
              Paramètres
            </Accordion.Header>
            <Accordion.Body className="ps-2">
              <ul className="nav flex-column gap-2">
                <li>
                  <Link href="/signup" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserPlus className="me-2 text-dark" /> Utilisateurs
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/medecin" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserDoctor className="me-2 text-success" /> Medecins
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/assurances" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserShield className="me-2 text-primary" /> Assurances
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/actes" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserShield className="me-2 text-primary" />Actes Cliniques
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/Typeacte" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserShield className="me-2 text-primary" /> Type d'actes
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/familleacte" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserShield className="me-2 text-primary" /> Famille d'actes
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/parametres/medicaments" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserShield className="me-2 text-primary" />Liste medicaments
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/medicamentachat" className="sidebar-link-medical d-flex align-items-center">
                    <FaUserShield className="me-2 text-primary" />Gestion Achats
                  </Link>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </aside>
    </>
  );
}
