'use client'
import { useRouter } from 'next/navigation';
import React from 'react'

function Verifconnecion({ children }: { children: React.ReactNode }) {

    const [laoder, setElaoder] = React.useState(true);
    const router = useRouter();



    React.useEffect(() => {
        if (typeof window !== 'undefined') {
           
            const profil = localStorage.getItem('profil');

            if (!profil) {
                router.push('/connexion');
            } else {
                setElaoder(false);
            }
        }
    }, [laoder]);

    if (laoder) {
        return <div>Chargement...</div>;
    } else{
        return <>{children}</>;
    }  

}

export default Verifconnecion
