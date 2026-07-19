'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Nav } from 'react-bootstrap';
import ModifierMotDePasseModal from '@/components/ModifierMotDePasseModal';

const MENU = [
    { key: 'dashboard',         label: 'Tableau de bord',          icon: 'bi bi-speedometer2',      color: 'text-primary' },
    { key: 'stock',             label: 'Gestion du stock',          icon: 'bi bi-capsule',            color: 'text-success' },
    { key: 'approvisionnement', label: 'Approvisionnement',         icon: 'bi bi-cart-plus',          color: 'text-warning' },
    { key: 'commandes',         label: 'Commandes en cours',        icon: 'bi bi-box-seam',            color: 'text-primary' },
    { key: 'fournisseurs',      label: 'Fournisseurs',              icon: 'bi bi-truck',              color: 'text-warning' },
    { key: 'historique',        label: 'Historique mouvements',     icon: 'bi bi-clock-history',      color: 'text-info'    },
    { key: 'mouvements',        label: 'Mouvements manuels',        icon: 'bi bi-arrow-left-right',   color: 'text-danger'  },
    { key: 'inventaire',        label: 'Inventaire complet',        icon: 'bi bi-clipboard2-check',   color: 'text-secondary' },
    { key: 'impression',        label: 'Impression / Rapports',     icon: 'bi bi-printer-fill',       color: 'text-dark'      },
    { key: 'motdepasse',        label: 'Mot de passe',              icon: 'bi bi-key-fill',           color: 'text-dark',  isModal: true },
];

export default function SidebarPharmacie() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vueActive = searchParams.get('vue') || 'dashboard';

    const [open, setOpen] = useState(false);
    const [user, setUser] = useState('');
    const [showMotDePasse, setShowMotDePasse] = useState(false);
    const [nbAlertes, setNbAlertes] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
        setUser(stored);
    }, []);

    useEffect(() => {
        const fetchAlertes = () => {
            fetch('/api/stock/alertes')
                .then(r => r.json())
                .then(d => {
                    const total = (d.ruptures?.length ?? 0) + (d.seuilsMin?.length ?? 0) + (d.peremptions?.length ?? 0);
                    setNbAlertes(total);
                })
                .catch(() => setNbAlertes(0));
        };
        fetchAlertes();
        const interval = setInterval(fetchAlertes, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleNav = (key: string) => {
        router.push(`/pages/servicepharmacie?vue=${key}`);
        setOpen(false);
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/connexion');
    };

    return (
        <>
            {/* Burger mobile */}
            <button
                className="sidebar-burger-medical d-lg-none"
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
                <div className="px-3 mb-2">
                    <small className="text-white-50 text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                        Service Pharmacie
                    </small>
                </div>
                <hr className="sidebar-separator-medical" />

                <Nav className="flex-column px-3">
                    {MENU.map(item => (
                        <Nav.Item key={item.key} className="mb-2">
                            <a
                                href="#"
                                className={`sidebar-link-medical d-flex align-items-center${vueActive === item.key && !item.isModal ? ' active' : ''}`}
                                onClick={e => {
                                    e.preventDefault();
                                    if (item.isModal) {
                                        setShowMotDePasse(true);
                                        setOpen(false);
                                    } else {
                                        handleNav(item.key);
                                    }
                                }}
                            >
                                <i className={`${item.icon} me-2 ${item.color}`}></i>
                                <span>{item.label}</span>
                                {item.key === 'dashboard' && nbAlertes > 0 && (
                                    <span className="badge bg-danger ms-auto">{nbAlertes}</span>
                                )}
                            </a>
                        </Nav.Item>
                    ))}
                </Nav>

                <div className="mt-auto px-3 pb-3">
                    {user && (
                        <div className="text-white-50 small mb-2 text-center">
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

            <ModifierMotDePasseModal
                show={showMotDePasse}
                onHide={() => setShowMotDePasse(false)}
            />
        </>
    );
}
