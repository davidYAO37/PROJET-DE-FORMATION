"use client";

import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { SocietePartenaire } from "@/types/SocietePartenaire";

interface Props {
    onSave: (data: Pick<SocietePartenaire, "Designation">) => void;
}

export default function AjouterSociete({ onSave }: Props) {
    const [show, setShow] = useState(false);
    const [Designation, setDesignation] = useState("");

    const handleSubmit = () => {
        if (!Designation.trim()) return;
        onSave({ Designation: Designation.trim() });
        setShow(false);
        setDesignation("");
    };

    return (
        <>
            <Button variant="primary" onClick={() => setShow(true)}>+ Ajouter</Button>

            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nouvelle Société Partenaire</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Société Partenaire</Form.Label>
                            <Form.Control
                                value={Designation}
                                onChange={(e) => setDesignation(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>Annuler</Button>
                    <Button variant="success" onClick={handleSubmit}>Enregistrer</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
