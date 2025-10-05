"use client";

import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface Props {
    onSave: (data: { Description: string }) => void;
}

export default function AjouteFamilleActe({ onSave }: Props) {
    const [show, setShow] = useState(false);
    const [description, setDescription] = useState("");

    const handleSubmit = () => {
        if (!description.trim()) return;
        onSave({ Description: description });
        setShow(false);
        setDescription("");
    };

    return (
        <>
            <Button variant="primary" onClick={() => setShow(true)}>+ Ajouter</Button>

            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nouvelle Famille Acte Biologique</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
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
