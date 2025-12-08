'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

interface HospitalisationWrapperProps {
    codePrestation?: string;
    examenHospitId?: string;
    onSuccess?: () => void;
}

const HospitalisationPage = dynamic(
    () => import('./page'),
    { ssr: false }
);

export default function HospitalisationWrapper({ 
    codePrestation = '', 
    examenHospitId = '',
    onSuccess 
}: HospitalisationWrapperProps) {
    
    useEffect(() => {
        // Ici, vous pouvez ajouter une logique pour charger les données existantes
        // si examenHospitId est fourni
        if (examenHospitId) {
            // Charger les données de l'examen existant
            console.log('Chargement des données pour l\'examen:', examenHospitId);
        }
        
        // Si un code de prestation est fourni, vous pouvez l'utiliser pour pré-remplir le formulaire
        if (codePrestation) {
            console.log('Code de prestation fourni:', codePrestation);
        }
        
    }, [codePrestation, examenHospitId]);

    return (
        <HospitalisationPage />
    );
}
