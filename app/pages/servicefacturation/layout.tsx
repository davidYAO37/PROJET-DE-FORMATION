import FacturationShell from './FacturationShell';
import Verifconnecion from '@/components/verifconnecion';
import RoleGuard from '@/components/RoleGuard';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Service Facturation',
  description: 'Interface de facturation médicale',
};

export default function FacturationLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <RoleGuard allowedRoles={['facturation', 'admin']}>
        <FacturationShell>{children}</FacturationShell>
      </RoleGuard>
    </Verifconnecion>
  );
}
