
import React from "react";
import { Modal } from "react-bootstrap";
import dynamic from 'next/dynamic';

interface ExamenHospitModalInfirmierProps {
    show: boolean;
    onHide: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
    onSuccess?: () => void;
}

// Chargement dynamique du wrapper pour éviter les erreurs de SSR
const HospitalisationWrapper = dynamic(
    () => import("@/app/pages/examenhospitalisation/HospitalisationWrapper"),
    { ssr: false }
);

export default function ExamenHospitModalInfirmier({ 
    show, 
    onHide, 
    CodePrestation = "", 
    examenHospitId = "",
    onSuccess
}: ExamenHospitModalInfirmierProps) {

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
                <HospitalisationWrapper 
                    codePrestation={CodePrestation}
                    examenHospitId={examenHospitId}
                    onSuccess={handleSuccess}
                />
            </Modal.Body>
        </Modal>
    );
}
