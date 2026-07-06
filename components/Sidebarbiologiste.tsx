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
import { useRouter } from 'next/navigation';



const menu = [
    { label: 'Accueil Patient', path: '/pages/servicebiologiste/patientLabo', icon: <i className="bi bi-house-door-fill me-2 text-success"></i> },
    { label: 'Examens à valider', path: '/pages/servicebiologiste/tbiologiste', icon: <i className="bi bi-speedometer2 me-2 text-primary"></i> },
    { label: 'Liste Examens Validés', path: '#', isModal: true, icon: <i className="bi bi-arrow-right-circle-fill me-2 text-info"></i> },
    { label: 'Gestion des automates', path: '#', isModal: true, icon: <i className="bi bi-clipboard2-pulse-fill me-2 text-danger"></i> },
    { label: 'Paramètres Examens', path: '#', isModal: true, icon: <i className="bi bi-calendar-fill me-2 text-primary"></i> },
    { label: 'Paramètres Biochimie', path: '#', isModal: true, icon: <i className="bi bi-calendar2-check-fill me-2 text-success"></i> },
    { label: 'Statistiques Labo', path: '/pages/servicebiologiste/statistiques', icon: <i className="bi bi-bar-chart-fill me-2 text-info"></i> },
    { label: 'Relevé de Compte', path: '/pages/servicebiologiste/releveCompte', icon: <i className="bi bi-receipt me-2 text-success"></i> },
    { label: 'Mot de passe', path: '#', isModal: true, icon: <i className="bi bi-key-fill me-2 text-dark"></i> },
];

export default function SidebarBiologiste() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [nbAValider, setNbAValider] = useState(0);

    useEffect(() => {
        const fetchNbAValider = async () => {
            try {
                const now = new Date();
                const debut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
                const res = await fetch(`/api/examens/aValider?dateDebut=${debut}&dateFin=${fin}`);
                const data = await res.json();
                setNbAValider(data.total || 0);
            } catch { setNbAValider(0); }
        };
        fetchNbAValider();
        const interval = setInterval(fetchNbAValider, 60000);
        // Écouter les mises à jour après validation/retour
        window.addEventListener('examens-avalider-updated', fetchNbAValider);
        return () => {
            clearInterval(interval);
            window.removeEventListener('examens-avalider-updated', fetchNbAValider);
        };
    }, []);
    const [showModifierMotDePasseModal, setShowModifierMotDePasseModal] = useState(false);
    const [showParametreExamenModal, setShowParametreExamenModal] = useState(false);
    const [showParametreBiochimieModal, setShowParametreBiochimieModal] = useState(false);
    const [showResultatsValidésModal, setShowResultatsValidésModal] = useState(false);
    const [showExamensValidésModal, setShowExamensValidésModal] = useState(false);
    const [showAutomateModal, setShowAutomateModal] = useState(false);

    const handleLinkClick = () => setOpen(false);

    const handleParametreLaboClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowParametreExamenModal(true);
        setOpen(false);
    };

    const handleAutomateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowAutomateModal(true);
        setOpen(false);
    };

    const handleParametreBiochimieClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowParametreBiochimieModal(true);
        setOpen(false);
    };

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

    const handleExamensValidésClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowExamensValidésModal(true);
        setOpen(false);
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/connexion');
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
                                                    : item.label === 'Liste Examens Validés'
                                                        ? handleExamensValidésClick
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
                                    {item.label === 'Examens à valider' && nbAValider > 0 && (
                                        <span className="badge bg-danger ms-auto">{nbAValider}</span>
                                    )}
                                </Link>
                            )}
                        </Nav.Item>
                    ))}
                </Nav>
                <div className="mt-auto px-3 pb-3">
                    <button
                        className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                        onClick={handleLogout}
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Se déconnecter</span>
                    </button>
                </div>
            </aside>

            {/* Modal Paramètres Examens */}
            <Modal show={showParametreExamenModal} onHide={() => setShowParametreExamenModal(false)} centered size="xl" dialogClassName="modal-xxl" scrollable contentClassName="border-0 shadow-lg rounded-4" className="modal-modern">
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

            {/* Modal Paramètres Biochimie */}
            <Modal show={showParametreBiochimieModal} onHide={() => setShowParametreBiochimieModal(false)} centered size="xl" dialogClassName="modal-xxl" scrollable contentClassName="border-0 shadow-lg rounded-4" className="modal-modern">
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

            {/* Modal Résultats Validés */}
            <Modal show={showResultatsValidésModal} onHide={() => setShowResultatsValidésModal(false)} centered size="xl" dialogClassName="modal-xxl" scrollable contentClassName="border-0 shadow-lg rounded-4" className="modal-modern">
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

            {/* Modal Liste Examens Validés */}
            <Modal show={showExamensValidésModal} onHide={() => setShowExamensValidésModal(false)} centered size="xl" dialogClassName="modal-xxl" scrollable contentClassName="border-0 shadow-lg rounded-4" className="modal-modern">
                <Modal.Header closeButton>
                    <Modal.Title>Liste Examens Validés</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4 rounded-3">
                    <ListeResultatValides />
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowExamensValidésModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Automate */}
            <Modal show={showAutomateModal} onHide={() => setShowAutomateModal(false)} centered size="xl" dialogClassName="modal-xxl" scrollable contentClassName="border-0 shadow-lg rounded-4" className="modal-modern">
                <Modal.Header closeButton>
                    <Modal.Title>Gestion des automates</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4 rounded-3">
                    <AutomatExamen />
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowAutomateModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Modifier Mot de passe */}
            <ModifierMotDePasseModal
                show={showModifierMotDePasseModal}
                onHide={() => setShowModifierMotDePasseModal(false)}
            />
        </>
    );
}
