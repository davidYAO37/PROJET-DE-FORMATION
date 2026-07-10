// app/pages/servicecomptabilite/layout.tsx
import Verifconnecion from '@/components/verifconnecion';
import ComptabiliteShell from './ComptabiliteShell';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Service Comptabilité',
  description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
      <ComptabiliteShell>
        {children}
      </ComptabiliteShell>
    </Verifconnecion>
  );
}
