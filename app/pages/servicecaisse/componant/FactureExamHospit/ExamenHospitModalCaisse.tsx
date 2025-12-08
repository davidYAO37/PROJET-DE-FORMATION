import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import HospitalisationPageCaisse from "./page";

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
}

export default function ExamenHospitalisationModalCaisse({
    show,
    onHide,
    CodePrestation = "",
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId = ""
}: ExamenHospitalisationModalProps) {

    const [key, setKey] = useState(0);

    useEffect(() => {
        if (show) {
            setKey(prevKey => prevKey + 1);
        }
    }, [show, CodePrestation, Designationtypeacte, examenHospitId]);

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
            <Modal.Header
                closeButton
                className="bg-primary text-white"
                style={{ padding: '1rem' }}
            >
                <Modal.Title>
                    {CodePrestation
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
                    key={`${key}-${CodePrestation}`}
                    params={{
                        id: examenHospitId || "",     // ✅ Correction MAJEURE
                        CodePrestation,
                        Designationtypeacte,
                        PatientP,
                        examenHospitId
                    }}
                    searchParams={{}}
                />
            </Modal.Body>
        </Modal>
    );
}
