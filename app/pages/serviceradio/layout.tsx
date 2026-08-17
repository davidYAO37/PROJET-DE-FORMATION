import 'bootstrap/dist/css/bootstrap.min.css';
import Verifconnecion from '@/components/verifconnecion';
import RoleGuard from '@/components/RoleGuard';
import SidebarRadio from '@/components/SidebarRadio';

export const metadata = {
  title: 'Service Radio',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
    <RoleGuard allowedRoles={['radiologue', 'admin']}>
    <div className="d-flex flex-column flex-md-row min-vh-100">
      <aside className="bg-light border-end">
        <SidebarRadio/>
      </aside>
      <div className="flex-grow-1 d-flex flex-column">
        <main className="p-3 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
    </RoleGuard>
    </Verifconnecion>
  );
}

