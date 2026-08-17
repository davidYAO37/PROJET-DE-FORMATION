// app/layout.tsx
import Sidebarbiologiste from '@/components/Sidebarbiologiste';
import Verifconnecion from '@/components/verifconnecion';
import RoleGuard from '@/components/RoleGuard';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Service Biologiste',
  description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <RoleGuard allowedRoles={['biologiste', 'admin']}>
      <div className="d-flex flex-column flex-md-row min-vh-100" style={{ minHeight: '100vh' }}>
        <Sidebarbiologiste />
        <main className="flex-grow-1 p-3">
          {children}
        </main>
      </div>
      </RoleGuard>
    </Verifconnecion>

  );
}
