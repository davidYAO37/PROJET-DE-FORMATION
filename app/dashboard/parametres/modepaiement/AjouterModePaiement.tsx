"use client";

import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface Props {
    onSave: (data: { Modepaiement: string }) => void;
}

export default function AjouteModePaiement({ onSave }: Props) {
    const [show, setShow] = useState(false);
    const [modepaiements, setmodepaiements] = useState("");

    const handleSubmit = () => {
        if (!modepaiements.trim()) return;
        onSave({ Modepaiement: modepaiements });
        setShow(false);
        setmodepaiements("");
    };

    return (
        <>
            <Button variant="primary" onClick={() => setShow(true)}>+ Ajouter</Button>

            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nouveau Mode de paiement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                value={modepaiements}
                                onChange={(e) => setmodepaiements(e.target.value)}
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
