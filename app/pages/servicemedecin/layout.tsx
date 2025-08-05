import 'bootstrap/dist/css/bootstrap.min.css';
import TopBarMedecin from './tmedecin/composants/TopBarMedecin';
import SidebarMedecin from '@/components/SidebarMedecin';
import Verifconnecion from '@/components/verifconnecion';

export const metadata = {
  title: 'Tableau de bord Médecin',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Verifconnecion>
    <div className="d-flex flex-column flex-md-row min-vh-100">
      <aside className="bg-light border-end">
        <SidebarMedecin/>
      </aside>
      <div className="flex-grow-1 d-flex flex-column">
        <TopBarMedecin />
        <main className="p-3 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
    </Verifconnecion>
  );
}

