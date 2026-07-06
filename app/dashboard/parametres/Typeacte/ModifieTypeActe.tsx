"use client";

import { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";

interface Props {
    show: boolean;
    onHide: () => void;
    data: { _id: string; Designation: string; Hospitalisation: boolean } | null;
    onSave: (data: any) => void;
}

export default function ModifieTypeActe({ show, onHide, data, onSave }: Props) {
    const [designation, setDesignation] = useState("");
    const [hospitalisation, setHospitalisation] = useState(false);

    useEffect(() => {
        setDesignation(data?.Designation || ""); 
        setHospitalisation(data?.Hospitalisation || false);
    }, [data]);

    if (!data) return null;

    const handleSubmit = () => {
        onSave({ ...data, Designation: designation, Hospitalisation: hospitalisation });
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
                    <Form.Group>
                        <Form.Check
                            type="checkbox"
                            label="Acte d'hospitalisation"
                            checked={hospitalisation}
                            onChange={(e) => setHospitalisation(e.target.checked)}
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
