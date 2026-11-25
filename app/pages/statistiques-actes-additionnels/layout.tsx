'use client';

import { useEffect, useState } from 'react';
import Sidebaracceuil from '@/components/Sidebaracceuil';
import Sidebarcaisse from '@/components/Sidebarcaisse';
import SidebarAccueilCaisse from '@/components/SidebarAccueilCaisse';
import SidebarMedecin from '@/components/SidebarMedecin';
import SidebarComptabilite from '@/components/SidebarComptabilite';
import SidebarFacturation from '@/components/SidebarFacturation';
import SidebarInfirmier from '@/components/SidebarInfirmier';
import Verifconnecion from '@/components/verifconnecion';

export default function StatistiquesActesAdditionnelsLayout({ children }: { children: React.ReactNode }) {
    const [Sidebar, setSidebar] = useState<React.ComponentType | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem('profil');
        let role = '';
        if (userData) {
            try {
                role = JSON.parse(userData).role || '';
            } catch {
                role = '';
            }
        }
        switch (role) {
            case 'medecin':
                setSidebar(() => SidebarMedecin);
                break;
            case 'caisse':
                setSidebar(() => Sidebarcaisse);
                break;
            case 'accueil-caisse':
                setSidebar(() => SidebarAccueilCaisse);
                break;
            case 'comptable':
                setSidebar(() => SidebarComptabilite);
                break;
            case 'facturation':
                setSidebar(() => SidebarFacturation);
                break;
            case 'infirmier':
                setSidebar(() => SidebarInfirmier);
                break;
            default:
                setSidebar(() => Sidebaracceuil);
        }
    }, []);

    return (
        <Verifconnecion>
            <div className="d-flex flex-column flex-md-row min-vh-100" style={{ minHeight: '100vh' }}>
                {Sidebar && <Sidebar />}
                <main className="flex-grow-1 p-3" style={{ minWidth: 0, overflowX: 'hidden' }}>
                    {children}
                </main>
            </div>
        </Verifconnecion>
    );
}
