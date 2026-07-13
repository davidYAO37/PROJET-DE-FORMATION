import FacturationShell from './FacturationShell';
import Verifconnecion from '@/components/verifconnecion';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Service Facturation',
  description: 'Interface de facturation médicale',
};

export default function FacturationLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <FacturationShell>{children}</FacturationShell>
    </Verifconnecion>
  );
}
