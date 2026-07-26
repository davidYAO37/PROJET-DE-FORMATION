
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
const HospitalisationWrapperUpdate = dynamic(
    () => import("@/app/pages/ExamenHospitUpdate/HospitalisationWrapperUpdate"),
    { ssr: false }
);

export default function ExamenHospitModalInfirmier({ 
    show, 
    onHide, 
    CodePrestation = "", 
    Designationtypeacte = "",
    PatientP = "",
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
        <Modal show={show} onHide={onHide} size="xl" centered scrollable
            dialogClassName="modal-xxl"
            backdrop="static"
            keyboard={false}
            style={{ maxWidth: '98vw', width: '98vw', margin: 'auto', height: '95vh' }}
            contentClassName="h-100"
        >
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    {CodePrestation
                        ? `SAISIE ACTES - ${Designationtypeacte || 'Prestation'}`
                        : 'Nouvelle prestation'}
                    {examenHospitId && (
                        <span className="ms-2 small fst-italic text-light">
                            (CODE PRESTATION: {CodePrestation})
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '0.5rem', maxHeight: 'calc(95vh - 120px)', overflow: 'auto' }}>
                <HospitalisationWrapperUpdate 
                    codePrestation={CodePrestation}
                    examenHospitId={examenHospitId}
                    Designationtypeacte={Designationtypeacte}
                    onSuccess={handleSuccess}
                />
            </Modal.Body>
        </Modal>
    );
}
