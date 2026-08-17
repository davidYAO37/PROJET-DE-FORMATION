// app/layout.tsx
import Sidebarcaisse from '@/components/Sidebarcaisse';
import Verifconnecion from '@/components/verifconnecion';
import RoleGuard from '@/components/RoleGuard';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Service Caisse',
  description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <RoleGuard allowedRoles={['caisse', 'admin']}>
      <div className="d-flex flex-column flex-md-row min-vh-100" style={{ minHeight: '100vh' }}>
        <Sidebarcaisse />
        <main className="flex-grow-1 p-3">

          {children}
        </main>
      </div>
      </RoleGuard>
    </Verifconnecion>

  );
}