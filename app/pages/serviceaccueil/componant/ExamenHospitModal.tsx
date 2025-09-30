import HospitalisationPage from "@/app/examenhospitalisation/page";
import React from "react";
import { Modal } from "react-bootstrap";

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
}

export default function ExamenHospitalisationModal({ show, onHide }: ExamenHospitalisationModalProps) {
    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title >Fiche de saisie Labo-Radio-Chir-Accouch... ou Hospitalisation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <HospitalisationPage />
            </Modal.Body>
        </Modal>
    );
}
