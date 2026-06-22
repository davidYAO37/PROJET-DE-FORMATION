"use client";

import { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { SocietePartenaire } from "@/types/SocietePartenaire";

interface Props {
    show: boolean;
    onHide: () => void;
    data: SocietePartenaire | null;
    onSave: (data: SocietePartenaire) => void;
}

export default function ModifierSociete({ show, onHide, data, onSave }: Props) {
    const [Designation, setDesignation] = useState("");

    useEffect(() => {
        setDesignation(data?.Designation || "");
    }, [data]);

    if (!data) return null;

    const handleSubmit = () => {
        if (!Designation.trim()) return;
        onSave({ ...data, Designation: Designation.trim() });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Modifier Société Partenaire</Modal.Title>
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
                <Button variant="secondary" onClick={onHide}>Annuler</Button>
                <Button variant="success" onClick={handleSubmit}>Enregistrer</Button>
            </Modal.Footer>
        </Modal>
    );
}
