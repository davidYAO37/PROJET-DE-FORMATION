
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import Verifconnecion from '@/components/verifconnecion';

export const metadata = {
  title: 'EasyMedical',
  description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <Verifconnecion>
          <div className="d-flex flex-column flex-md-row min-vh-100" style={{ minHeight: '100vh' }}>
         
            <main className="flex-grow-1 p-3">
              {children}
            </main>
          </div>
        </Verifconnecion>
        <script src="/js/bootstrap.bundle.js"></script>
      </body>
    </html>
  );
}
