"use client";
import { ActeParamBiochimie } from "@/types/ActeParamBiochimie";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    param: ActeParamBiochimie | null;
    onSave: (param: ActeParamBiochimie) => void;
};

export default function ModifierParamActeBiochimie({ show, onHide, param, onSave }: Props) {
    const [form, setForm] = useState({
        IDPARAM_BIOCHIME: "",
        param_designb: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Remplir le formulaire quand on reçoit un paramètre d'acte
    useEffect(() => {
        if (param) {
            setForm({
                IDPARAM_BIOCHIME: param.IDPARAM_BIOCHIME || "",
                param_designb: param.param_designb || "",
            });
        }
    }, [param]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.param_designb.trim()) {
            setError("La désignation du paramètre est obligatoire");
            return;
        }

        setLoading(true);
        try {
            await onSave({
                ...param,
                ...form,
            } as ActeParamBiochimie);
        } catch (err: any) {
            setError(err.message || "Erreur lors de la modification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Modifier un Paramètre d'Acte Biochimie</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Paramètre Biochimie</Form.Label>
                        <Form.Control
                            type="text"
                            name="IDPARAM_BIOCHIME"
                            value={form.IDPARAM_BIOCHIME}
                            onChange={handleChange}
                            disabled
                            placeholder="ID du paramètre biochimie"
                        />
                        <Form.Text className="text-muted">ID du paramètre biochimie associé</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Désignation du Paramètre *</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="param_designb"
                            value={form.param_designb}
                            onChange={handleChange}
                            placeholder="Entrez la désignation du paramètre"
                            rows={3}
                            required
                        />
                        <Form.Text className="text-muted">Désignation qui sera affichée dans les résultats</Form.Text>
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
                        "Enregistrer"
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
