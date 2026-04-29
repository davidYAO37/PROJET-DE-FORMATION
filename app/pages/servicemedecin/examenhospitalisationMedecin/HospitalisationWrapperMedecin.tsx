'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

interface HospitalisationWrapperMedecinProps {
    codePrestation?: string;
    examenHospitId?: string;
    onSuccess?: () => void;
}

const HospitalisationPageMedecin = dynamic(
    () => import('./page'),
    { ssr: false }
);

export default function HospitalisationWrapperMedecin({ 
    codePrestation = '', 
    onSuccess 
}: HospitalisationWrapperMedecinProps) {
    
    useEffect(() => {
        // Si un code de prestation est fourni, le stocker dans le localStorage
        // pour que le composant HospitalisationPageMedecin puisse le récupérer
        if (codePrestation) {
            console.log('Code de prestation fourni au wrapper:', codePrestation);
            localStorage.setItem('codePrestationConsultation', codePrestation);
            
            // Aussi, mettre à jour directement si possible
            // On peut aussi déclencher un événement personnalisé
            window.dispatchEvent(new CustomEvent('codePrestationChanged', { 
                detail: { codePrestation } 
            }));
        }
        
    }, [codePrestation]);

    return (
        <HospitalisationPageMedecin />
    );
}
