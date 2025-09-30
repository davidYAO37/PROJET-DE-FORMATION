"use client";

import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface Props {
    onSave: (data: { Designation: string }) => void;
}

export default function AjoutTypeActe({ onSave }: Props) {
    const [show, setShow] = useState(false);
    const [designation, setDesignation] = useState("");

    const handleSubmit = () => {
        if (!designation.trim()) return;
        onSave({ Designation: designation });
        setShow(false);
        setDesignation("");
    };

    return (
        <>
            <Button variant="primary" onClick={() => setShow(true)}>+ Ajouter</Button>

            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nouveau Type d’acte</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Désignation</Form.Label>
                            <Form.Control
                                value={designation}
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
