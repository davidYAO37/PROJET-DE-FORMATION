
import React, { useEffect, useState } from "react";
import { Modal, Spinner } from "react-bootstrap";
import dynamic from 'next/dynamic';

interface ExamenHospitalisationModalProps {
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
    { 
        ssr: false,
        loading: () => (
            <div className="text-center p-4">
                <Spinner animation="border" variant="primary" />
                <p>Chargement de la prestation...</p>
            </div>
        )
    }
);

export default function ExamenHospitalisationModalUpdate({ 
    show, 
    onHide, 
    CodePrestation = "", 
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId = "",
    onSuccess
}: ExamenHospitalisationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess();
        }
        onHide();
    };

    const handleClose = () => {
        setError(null);
        onHide();
    };

    // Effet pour gérer le chargement des données de la prestation
    useEffect(() => {
        if (show && CodePrestation) {
            setIsLoading(true);
            setError(null);
            
            // Ici, vous pouvez ajouter une logique de chargement des données
            // si nécessaire avant d'afficher le modal
            
            setIsLoading(false);
        }
    }, [show, CodePrestation]);

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    {examenHospitId ? 'Modifier la prestation' : 'Nouvelle prestation'}
                    {PatientP && (
                        <div className="small mt-1">
                            Patient: <strong>{PatientP}</strong>
                            {Designationtypeacte && (
                                <span className="ms-3">
                                    Type: <strong>{Designationtypeacte}</strong>
                                </span>
                            )}
                        </div>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}
                
                {isLoading ? (
                    <div className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                        <p>Chargement des données de la prestation...</p>
                    </div>
                ) : (
                    <HospitalisationWrapper 
                        codePrestation={CodePrestation}
                        examenHospitId={examenHospitId}
                        onSuccess={handleSuccess}
                    />
                )}
            </Modal.Body>
        </Modal>
    );
}
