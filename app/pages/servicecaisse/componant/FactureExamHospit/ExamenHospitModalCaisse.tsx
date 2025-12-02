import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import HospitalisationPageCaisse from "./HospitalisationPageCaisse";

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
    Code_Prestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
    // Ajout d'une prop pour forcer le rechargement du composant interne
    keyProp?: string | number;
}

export default function ExamenHospitalisationModalCaisse({
    show,
    onHide,
    Code_Prestation = "",
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId = ""
}: ExamenHospitalisationModalProps) {
    // Utilisation d'une clé pour forcer le rechargement du composant interne
    const [key, setKey] = useState(0);

    // Réinitialiser la clé lorsque le modal est ouvert/fermé ou que les props changent
    useEffect(() => {
        if (show) {
            setKey(prevKey => prevKey + 1);
        }
    }, [show, Code_Prestation, Designationtypeacte, examenHospitId]);

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            scrollable
            dialogClassName="modal-xxl"
            style={{ maxWidth: '95vw', width: '95vw', margin: 'auto' }}
        >
            <Modal.Header closeButton className="bg-primary text-white" style={{ padding: '1rem' }}>
                <Modal.Title>
                    {Code_Prestation
                        ? `Facturation - ${Designationtypeacte || 'Prestation'}`
                        : 'Nouvelle facture'}
                    {examenHospitId && (
                        <span className="ms-2 small fst-italic text-light">
                            (ID: {examenHospitId})
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <HospitalisationPageCaisse
                    key={`${key}-${Code_Prestation}`}
                    Code_Prestation={Code_Prestation}
                    Designationtypeacte={Designationtypeacte}
                    PatientP={PatientP}
                    examenHospitId={examenHospitId}
                />
            </Modal.Body>
        </Modal>
    );
}