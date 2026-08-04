
import React from "react";
import { Modal } from "react-bootstrap";
import dynamic from 'next/dynamic';
import HospitalisationWrapperBilan from "../../examenhospitalisationBilan/HospitalisationWrapperBilan";

interface ExamenHospitalisationModalBilanProps {
    show: boolean;
    onHide: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
    onSuccess?: () => void;
}

// Chargement dynamique du wrapper pour éviter les erreurs de SSR
const HospitalisationWrapperBilanComponent = dynamic(
    () => import("@/app/pages/examenhospitalisationBilan/HospitalisationWrapperBilan"),
    { ssr: false }
);

export default function ExamenHospitalisationModalBilan({ 
    show, 
    onHide, 
    CodePrestation = "", 
    examenHospitId = "",
    onSuccess
}: ExamenHospitalisationModalBilanProps) {

    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess();
        }
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    {examenHospitId ? 'Modifier la prestation' : 'Nouvelle prestation'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <HospitalisationWrapperBilanComponent 
                    codePrestation={CodePrestation}
                    examenHospitId={examenHospitId}
                    onSuccess={handleSuccess}
                />
            </Modal.Body>
        </Modal>
    );
}
