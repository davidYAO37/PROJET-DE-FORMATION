"use client";
import { ParamBiochimie } from "@/types/ParamBiochimie";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

interface Props {
    show: boolean;
    onHide: () => void;
    ParamBiochimie: ParamBiochimie | null;
    onSave: (param: ParamBiochimie) => void;
}

export default function ModifierParamBiochimie({ show, onHide, ParamBiochimie, onSave }: Props) {
    const [form, setForm] = useState({
        CodeB: "",
        LibelleB: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (ParamBiochimie) {
            setForm({
                CodeB: ParamBiochimie.CodeB || "",
                LibelleB: ParamBiochimie.LibelleB || "",
            });
        }
    }, [ParamBiochimie]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.LibelleB.trim()) {
            setError("Le libellé est obligatoire");
            return;
        }

        if (!ParamBiochimie?._id) {
            setError("Paramètre non trouvé");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/parambiochimie/${ParamBiochimie._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur lors de la modification");
            }

            const updatedParam = await response.json();
            onSave(updatedParam);
            onHide();
        } catch (err: any) {
            setError(err.message || "Erreur lors de la modification du paramètre");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Modifier un Paramètre Biochimie</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Code B</Form.Label>
                        <Form.Control
                            type="text"
                            name="CodeB"
                            value={form.CodeB}
                            onChange={handleChange}
                            placeholder="Entrez le code (optionnel)"
                            maxLength={10}
                        />
                        <Form.Text className="text-muted">Optionnel, maximum 10 caractères</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Libellé B *</Form.Label>
                        <Form.Control
                            type="text"
                            name="LibelleB"
                            value={form.LibelleB}
                            onChange={handleChange}
                            placeholder="Entrez le libellé"
                            required
                            maxLength={500}
                        />
                        <Form.Text className="text-muted">Obligatoire, maximum 500 caractères</Form.Text>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Annuler
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Modification en cours...
                        </>
                    ) : (
                        "Modifier"
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
