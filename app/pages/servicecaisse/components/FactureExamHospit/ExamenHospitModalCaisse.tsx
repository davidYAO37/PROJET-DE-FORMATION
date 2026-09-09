import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import dynamic from "next/dynamic";
import HospitalisationPageCaisse from "./page";

// Chargement dynamique du reçu d'examen (côté client uniquement)
const RecuExamenPrint = dynamic(
    () => import("@/app/pages/MesImpressions/recusacte/RecuExamenPrint"),
    { ssr: false }
);

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess?: () => void;
    onPaiementSuccess?: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
    dateEntree?: string | null;
    dateSortie?: string | null;
    nombreDeJours?: number;
    Rclinique?: string;
}

export default function ExamenHospitalisationModalCaisse({
    show,
    onHide,
    onSuccess,
    onPaiementSuccess,
    CodePrestation = "",
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId = "",
    dateEntree = null,
    dateSortie = null,
    nombreDeJours = 1,
    Rclinique = ""
}: ExamenHospitalisationModalProps) {

    const [key, setKey] = useState(0);
    const [showRecu, setShowRecu] = useState(false);
    const [recuFactureId, setRecuFactureId] = useState<string | null>(null);

    const closeAndNotify = () => {
        setShowRecu(false);
        setRecuFactureId(null);
        onPaiementSuccess?.();
        onSuccess?.();
        setKey(prevKey => prevKey + 1);
        onHide();
    };

    // Affichage automatique du reçu après facturation réussie
    const handleOnSuccess = (factureId?: string) => {
        if (factureId) {
            setRecuFactureId(factureId);
            setShowRecu(true);
        } else {
            closeAndNotify();
        }
    };

    return (
        <>
        <Modal
            show={show}
            onHide={onHide}
            fullscreen
            scrollable
            backdrop="static"
            keyboard={false}
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

            <Modal.Body style={{ padding: '0.5rem', overflow: 'auto' }}>
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
                        Rclinique,
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

        {/* Modal pour l'aperçu du reçu d'examen */}
        <Modal
            show={showRecu}
            onHide={() => {
                setShowRecu(false);
                closeAndNotify();
            }}
            size="xl"
            centered
            fullscreen="lg-down"
        >
            <Modal.Header closeButton>
                <Modal.Title>Reçu d'examen</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: '80vh' }}>
                {recuFactureId && (
                    <RecuExamenPrint params={{ id: recuFactureId }} />
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => {
                    setShowRecu(false);
                    closeAndNotify();
                }}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    );
}