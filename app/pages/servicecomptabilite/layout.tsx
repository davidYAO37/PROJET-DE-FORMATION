// app/pages/servicecomptabilite/layout.tsx
import Verifconnecion from '@/components/verifconnecion';
import RoleGuard from '@/components/RoleGuard';
import ComptabiliteShell from './ComptabiliteShell';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Service Comptabilité',
  description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <RoleGuard allowedRoles={['comptable', 'admin']}>
        <ComptabiliteShell>
          {children}
        </ComptabiliteShell>
      </RoleGuard>
    </Verifconnecion>
  );
}
