import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import PrescriptionPageCaisse from "./PrescriptionPageCaisse";

interface PrescriptionModalCaisseProps {
    show: boolean;
    onHide: () => void;
    onSuccess?: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    prescriptionId?: string;
    dateDebut?: string | null;
    dateFin?: string | null;
    remarques?: string;
}

export default function PrescriptionModalCaisse({
    show,
    onHide,
    onSuccess,
    CodePrestation = "",
    Designationtypeacte = "",
    PatientP = "",
    prescriptionId = "",
    dateDebut = null,
    dateFin = null,
    remarques = ""
}: PrescriptionModalCaisseProps) {

    const [key, setKey] = useState(0);

    // Fermeture automatique après facturation réussie
    const handleOnSuccess = () => {
        if (onSuccess) {
            onSuccess();
        }
        setKey(prevKey => prevKey + 1);
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            scrollable
            dialogClassName="modal-xxl"
            backdrop="static"
            keyboard={false}
            style={{ maxWidth: '95vw', width: '95vw', margin: 'auto' }}
        >
            <Modal.Header
                closeButton
                className="bg-primary text-white"
                style={{ padding: '1rem' }}
            >
                <Modal.Title>
                    {CodePrestation
                        ? `FACTURATION - ${Designationtypeacte || 'Prestation'}`
                        : 'Nouvelle facture'}
                    {prescriptionId && (
                        <span className="ms-2 small fst-italic text-light">
                            (CODE PRESTATION: {CodePrestation})
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <PrescriptionPageCaisse
                    key={`${key}-${CodePrestation}`}
                    params={{
                        id: prescriptionId || "",
                        CodePrestation,
                        Designationtypeacte,
                        PatientP,
                        prescriptionId,
                        dateDebut: dateDebut || undefined,
                        dateFin: dateFin || undefined,
                        remarques
                    }}
                    searchParams={{}}
                    onSuccess={handleOnSuccess}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Annuler
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
