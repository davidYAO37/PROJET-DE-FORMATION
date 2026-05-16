'use client'
import { useRouter, usePathname } from 'next/navigation';
import React from 'react'

function Verifconnecion({ children }: { children: React.ReactNode }) {

    const [laoder, setElaoder] = React.useState(true);
    const router = useRouter();
    const pathname = usePathname();



    // Public pages that don't require authentication
    const publicPages = ['/', '/connexion'];

    React.useEffect(() => {
        if (typeof window !== 'undefined') {

            const profil = localStorage.getItem('profil');

            // Allow public pages without authentication
            if (publicPages.includes(pathname)) {
                setElaoder(false);
                return;
            }

            // Redirect to connexion if not authenticated on protected pages
            if (!profil) {
                router.push('/connexion');
            } else {
                setElaoder(false);
            }
        }
    }, [pathname, router]);

    if (laoder) {
        return <div>Chargement...</div>;
    } else {
        return <>{children}</>;
    }

}

export default Verifconnecion
