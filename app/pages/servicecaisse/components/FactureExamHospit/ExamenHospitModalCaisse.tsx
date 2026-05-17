import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import HospitalisationPageCaisse from "./page";

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess?: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
    dateEntree?: string | null;
    dateSortie?: string | null;
    nombreDeJours?: number;
    renseignementclinique?: string;
}

export default function ExamenHospitalisationModalCaisse({
    show,
    onHide,
    onSuccess,
    CodePrestation = "",
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId = "",
    dateEntree = null,
    dateSortie = null,
    nombreDeJours = 1,
    renseignementclinique = ""
}: ExamenHospitalisationModalProps) {

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
                    {examenHospitId && (
                        <span className="ms-2 small fst-italic text-light">
                            (CODE PRESTATION: {CodePrestation})
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <HospitalisationPageCaisse
                    key={`${key}-${CodePrestation}`}
                    params={{
                        id: examenHospitId || "",
                        CodePrestation,
                        Designationtypeacte,
                        PatientP,
                        examenHospitId,
                        dateEntree: dateEntree || undefined,
                        dateSortie: dateSortie || undefined,
                        nombreDeJours,
                        renseignementclinique
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