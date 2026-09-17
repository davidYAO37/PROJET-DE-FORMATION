'use client';

import { useEffect, useState } from 'react';
import Sidebaracceuil from '@/components/Sidebaracceuil';
import SidebarMedecin from '@/components/SidebarMedecin';
import SidebarComptabilite from '@/components/SidebarComptabilite';
import SidebarInfirmier from '@/components/SidebarInfirmier';
import Verifconnecion from '@/components/verifconnecion';

export default function StatistiquesRendezvousLayout({ children }: { children: React.ReactNode }) {
  const [Sidebar, setSidebar] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('profil');
    if (userData) {
      try {
        const profil = JSON.parse(userData);
        switch (profil.role) {
          case 'medecin':
            setSidebar(() => SidebarMedecin);
            break;
          case 'accueil':
            setSidebar(() => Sidebaracceuil);
            break;
          case 'comptable':
            setSidebar(() => SidebarComptabilite);
            break;
          case 'infirmier':
            setSidebar(() => SidebarInfirmier);
            break;
          default:
            setSidebar(() => Sidebaracceuil);
        }
      } catch {
        setSidebar(() => Sidebaracceuil);
      }
    } else {
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
