// app/layout.tsx
import Sidebaraccueil from '@/components/Sidebaracceuil';
import Verifconnecion from '@/components/verifconnecion';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Tableau de Bord Médical',
  description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>

      <div className="d-flex flex-column flex-md-row min-vh-100" style={{ minHeight: '100vh' }}>
        <Sidebaraccueil />
        <main className="flex-grow-1 p-3">

          {children}
        </main>
      </div>

    </Verifconnecion>

  );
}
