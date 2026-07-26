'use client';

import dynamic from 'next/dynamic';

interface HospitalisationWrapperProps {
    codePrestation?: string;
    examenHospitId?: string;
    Designationtypeacte?: string;
    onSuccess?: () => void;
}

const HospitalisationPage = dynamic(
    () => import('./page'),
    { ssr: false }
);

export default function HospitalisationWrapperUpdate({ 
    codePrestation = '', 
    examenHospitId = '',
    Designationtypeacte = '',
    onSuccess 
}: HospitalisationWrapperProps) {
    return (
        <HospitalisationPage
            initialCodePrestation={codePrestation}
            initialExamenHospitId={examenHospitId}
            initialDesignationtypeacte={Designationtypeacte}
            onSuccess={onSuccess}
        />
    );
}
