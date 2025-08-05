// app/layout.tsx
import Sidebarcaisse from '@/components/Sidebarcaisse';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Tableau de Bord Médical',
  description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="d-flex">
           <div className="d-flex" style={{ minHeight: '100vh' }}>
            <Sidebarcaisse/>
           <main className="flex-grow-1 p-3">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
