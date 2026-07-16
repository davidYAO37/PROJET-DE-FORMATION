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
            // Allow public pages without authentication
            if (publicPages.includes(pathname)) {
                setElaoder(false);
                return;
            }

            // Vérifier le cookie JWT côté serveur via /api/me
            const checkAuth = async () => {
                try {
                    const res = await fetch('/api/me', { credentials: 'include' });
                    if (!res.ok) {
                        router.push('/connexion');
                    } else {
                        setElaoder(false);
                    }
                } catch (error) {
                    router.push('/connexion');
                }
            };

            checkAuth();
        }
    }, [pathname, router]);

    if (laoder) {
        return <div>Chargement...</div>;
    } else {
        return <>{children}</>;
    }

}

export default Verifconnecion
