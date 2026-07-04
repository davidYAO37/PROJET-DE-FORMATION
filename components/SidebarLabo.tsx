'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button, Modal, Nav } from 'react-bootstrap';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';
import ActeBiochimie from '@/app/dashboard/parametres/acteBiochimie/page';
import ActeBiologie from '@/app/dashboard/parametres/acteBiologie/page';
import ListeResultatValides from '@/app/pages/ResultatValides/page';
import AutomatExamen from './AutomatExamen';
const menu = [
    { label: 'Tableau de bord', path: '/pages/servicelaboratoire/tlaboratoire', icon: <i className="bi bi-speedometer2 me-2 text-primary"></i> },
    { label: 'Accueil Patient', path: '/pages/servicelaboratoire/patientLabo', icon: <i className="bi bi-house-door-fill me-2 text-success"></i> },
    { label: 'Liste Resultat Retour', path: '/pages/servicelaboratoire/components/ListeResultatRetour', icon: <i className="bi bi-arrow-right-circle-fill me-2 text-info"></i> },
    { label: 'Resultats Validés', path: '#', isModal: true, icon: <i className="bi bi-people-fill me-2 text-warning"></i> },
    { label: 'Gestion des automates', path: '#',isModal: true, icon: <i className="bi bi-clipboard2-pulse-fill me-2 text-danger"></i> },
    { label: 'Paramètres Examens', path: '#', isModal: true, icon: <i className="bi bi-calendar-fill me-2 text-primary"></i> },
    { label: 'Paramètres Biochimie', path: '#', isModal: true, icon: <i className="bi bi-calendar2-check-fill me-2 text-success"></i> },
    { label: 'Mot de passe', path: '#', isModal: true, icon: <i className="bi bi-key-fill me-2 text-dark"></i> },
];

export default function SidebarLabo() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [showModifierMotDePasseModal, setShowModifierMotDePasseModal] = useState(false);
    const [user, setUser] = useState('');
    const [showParametreExamenModal, setShowParametreExamenModal] = useState(false);
    const [showParametreBiochimieModal, setShowParametreBiochimieModal] = useState(false);
    const [showResultatsValidésModal, setShowResultatsValidésModal] = useState(false);
    const [showAutomateModal,setShowAutomateModal]=useState(false);

    // Notifications
    const [nbAReceptionner, setNbAReceptionner] = useState(0);
    const [nbASaisir, setNbASaisir] = useState(0);
    const [nbRetour, setNbRetour] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const now = new Date();
                const debut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

                const [resReception, resSaisir, resRetour] = await Promise.all([
                    fetch(`/api/ReceptionExamenLabo/ListeAreceptioner?startDate=${debut}&endDate=${fin}`),
                    fetch(`/api/ReceptionExamenLabo/ListeAsaisir?startDate=${debut}&endDate=${fin}`),
                    fetch(`/api/ReceptionExamenLabo/retourResultat?startDate=${debut}&endDate=${fin}`),
                ]);

                const dataReception = await resReception.json();
                const dataSaisir = await resSaisir.json();
                const dataRetour = await resRetour.json();

                setNbAReceptionner(Array.isArray(dataReception) ? dataReception.length : 0);
                setNbASaisir(Array.isArray(dataSaisir) ? dataSaisir.length : 0);
                setNbRetour(Array.isArray(dataRetour) ? dataRetour.length : 0);
            } catch { 
                setNbAReceptionner(0);
                setNbASaisir(0);
                setNbRetour(0);
            }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 60000);
        window.addEventListener('labo-counts-updated', fetchCounts);
        return () => {
            clearInterval(interval);
            window.removeEventListener('labo-counts-updated', fetchCounts);
        };
    }, []);

    // Charger l'utilisateur connecté au montage
    useEffect(() => {
        const storedUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
        setUser(storedUser);
    }, []);

    // Ferme la sidebar quand on clique sur un lien (mobile)
    const handleLinkClick = () => setOpen(false);



    // Ouvre le modal de parametre labo
    const handleParametreLaboClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowParametreExamenModal(true);
        setOpen(false);
    };
    // Ouvre le modal automate
    const handleAutomateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowAutomateModal(true);
        setOpen(false);
    };
    // Ouvre le modal de parametre biochimie
    const handleParametreBiochimieClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowParametreBiochimieModal(true);
        setOpen(false);
    };

    // Ouvre le modal de modification du mot de passe
    const handleMotDePasseClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowModifierMotDePasseModal(true);
        setOpen(false);
    };

    const handleResultatsValidésClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowResultatsValidésModal(true);
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
                            {item.label === 'Paramètres Examens' ? (
                                <a
                                    href="#"
                                    className="sidebar-link-medical d-flex align-items-center"
                                    onClick={handleParametreLaboClick}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </a>
                            ) : item.isModal ? (
                                <a
                                    href="#"
                                    className="sidebar-link-medical d-flex align-items-center"
                                    onClick={
                                        item.label === 'Gestion des automates'
                                            ? handleAutomateClick
                                            : item.label === 'Paramètres Biochimie'
                                            ? handleParametreBiochimieClick
                                            : item.label === 'Mot de passe'
                                                ? handleMotDePasseClick
                                                : item.label === 'Resultats Validés'
                                                    ? handleResultatsValidésClick
                                                    : undefined
                                    }
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
                                    {item.label === 'Tableau de bord' && (
                                        <>
                                            {nbAReceptionner > 0 && (
                                                <span className="badge bg-success ms-auto">{nbAReceptionner}</span>
                                            )}
                                            {nbASaisir > 0 && (
                                                <span className="badge bg-danger ms-1">{nbASaisir}</span>
                                            )}
                                        </>
                                    )}
                                    {item.label === 'Liste Resultat Retour' && nbRetour > 0 && (
                                        <span className="badge bg-warning text-dark ms-auto">{nbRetour}</span>
                                    )}
                                </Link>
                            )}
                        </Nav.Item>
                    ))}
                </Nav>
            </aside>
            {/* Modal pour les paramètres examens et biochimie */}
            <Modal
                show={showParametreExamenModal}
                onHide={() => setShowParametreExamenModal(false)}
                centered
                size="xl"
                dialogClassName="modal-xxl"
                scrollable
                contentClassName="border-0 shadow-lg rounded-4"
                className="modal-modern"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Paramètres Examens</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4 rounded-3">
                    <ActeBiologie />
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowParametreExamenModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>
            <Modal
                show={showParametreBiochimieModal}
                onHide={() => setShowParametreBiochimieModal(false)}
                centered
                size="xl"
                dialogClassName="modal-xxl"
                scrollable
                contentClassName="border-0 shadow-lg rounded-4"
                className="modal-modern"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Paramètres Biochimie</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4 rounded-3">
                    <ActeBiochimie />
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowParametreBiochimieModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>


            {/* Modal de modification du mot de passe */}
            <ModifierMotDePasseModal
                show={showModifierMotDePasseModal}
                onHide={() => setShowModifierMotDePasseModal(false)}
            />
            {/* Modal des résultats validés */}
            <Modal
                show={showResultatsValidésModal}
                onHide={() => setShowResultatsValidésModal(false)}
                centered
                size="xl"
                dialogClassName="modal-xxl"
                scrollable
                contentClassName="border-0 shadow-lg rounded-4"
                className="modal-modern"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Résultats Validés</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4 rounded-3">
                    <ListeResultatValides />
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowResultatsValidésModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal automate */}
            <Modal
                show={showAutomateModal}
                onHide={() => setShowAutomateModal(false)}
                centered
                size="xl"
                dialogClassName="modal-xxl"
                scrollable
                contentClassName="border-0 shadow-lg rounded-4"
                className="modal-modern"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Automate</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4 rounded-3">
                    <AutomatExamen />
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowAutomateModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>

        </>
    );
}
