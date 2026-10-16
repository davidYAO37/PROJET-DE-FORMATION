
import Verifconnecion from '@/components/verifconnecion';
import RoleGuard from '@/components/RoleGuard';
import 'bootstrap/dist/css/bootstrap.min.css';
import SidebarAccueilCaisse from '@/components/SidebarAccueilCaisse';

export const metadata = {
  title: 'Accueil & Caisse',
  description: 'Interface combinée accueil et caisse',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <RoleGuard allowedRoles={['accueil-caisse', 'admin']}>
        <div className="d-flex flex-column flex-md-row min-vh-100" style={{ minHeight: '100vh' }}>
          <SidebarAccueilCaisse />
          <main className="flex-grow-1 p-3">
            {children}
          </main>
        </div>
      </RoleGuard>
    </Verifconnecion>
  );
}
