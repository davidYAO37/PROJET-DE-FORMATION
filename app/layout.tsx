
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main className="flex-grow-1 p-3">
          {children}
        </main>
        <script src="/js/bootstrap.bundle.js"></script>
      </body>
    </html>
  );
}
