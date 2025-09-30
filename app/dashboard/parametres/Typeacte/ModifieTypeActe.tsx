"use client";

import { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface Props {
    show: boolean;
    onHide: () => void;
    data: { _id: string; Designation: string } | null;
    onSave: (data: any) => void;
}

export default function ModifieTypeActe({ show, onHide, data, onSave }: Props) {
    const [designation, setDesignation] = useState("");

    useEffect(() => {
        setDesignation(data?.Designation || "");
    }, [data]);

    if (!data) return null;

    const handleSubmit = () => {
        onSave({ ...data, Designation: designation });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Modifier Type d’acte</Modal.Title>
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
                <Button variant="secondary" onClick={onHide}>Annuler</Button>
                <Button variant="success" onClick={handleSubmit}>Enregistrer</Button>
            </Modal.Footer>
        </Modal>
    );
}
