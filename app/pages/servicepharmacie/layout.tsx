import { Suspense } from 'react';
import SidebarPharmacie from '@/components/SidebarPharmacie';
import Verifconnecion from '@/components/verifconnecion';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Service Pharmacie',
  description: 'Interface de gestion du stock médicaments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <div className="d-flex flex-column flex-md-row min-vh-100" style={{ minHeight: '100vh' }}>
        <Suspense fallback={<aside className="sidebar-medical" />}>
          <SidebarPharmacie />
        </Suspense>
        <main className="flex-grow-1 p-3">
          {children}
        </main>
      </div>
    </Verifconnecion>
  );
}
