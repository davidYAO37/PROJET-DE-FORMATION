"use client";

import { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface Props {
    show: boolean;
    onHide: () => void;
    data: { _id: string; Description: string } | null;
    onSave: (data: any) => void;
}

export default function ModifierFamilleActe({ show, onHide, data, onSave }: Props) {
    const [description, setDescription] = useState("");

    useEffect(() => {
        setDescription(data?.Description || "");
    }, [data]);

    if (!data) return null;

    const handleSubmit = () => {
        onSave({ ...data, Description: description });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Modifier Famille Acte</Modal.Title>
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
                <Button variant="secondary" onClick={onHide}>Annuler</Button>
                <Button variant="success" onClick={handleSubmit}>Enregistrer</Button>
            </Modal.Footer>
        </Modal>
    );
}
