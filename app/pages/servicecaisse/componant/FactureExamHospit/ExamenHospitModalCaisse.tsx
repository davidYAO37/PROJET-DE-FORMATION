
import React from "react";
import { Modal } from "react-bootstrap";
import HospitalisationPageCaisse from "./page";

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
}

export default function ExamenHospitalisationModalCaisse({ show, onHide }: ExamenHospitalisationModalProps) {
    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title >Fiche de saisie Labo-Radio-Chir-Accouch... ou Hospitalisation A facturer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <HospitalisationPageCaisse />
            </Modal.Body>
        </Modal>
    );
}
