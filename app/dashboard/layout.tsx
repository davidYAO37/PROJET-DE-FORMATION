// app/layout.tsx

import Sidebar from '@/components/Sidebar';
import Verifconnecion from '@/components/verifconnecion';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import LicenceAlertBanner from '@/components/licence/LicenceAlertBanner';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
    title: 'Tableau de Bord Médical',
    description: 'Interface de gestion médicale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <Verifconnecion>

            <div className="d-flex flex-column min-vh-100" style={{ minHeight: '100vh' }}>
                <ImpersonationBanner />
                <LicenceAlertBanner />
                <div className="d-flex flex-column flex-md-row flex-grow-1">
                    <Sidebar />
                    < main className="flex-grow-1 p-3" >

                        {children}
                    </main>
                </div>
            </div>

        </Verifconnecion>

    );
}
