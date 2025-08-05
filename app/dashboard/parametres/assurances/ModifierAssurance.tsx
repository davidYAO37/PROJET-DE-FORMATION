"use client";
import { Assurance } from "@/types/assurance";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
type Props = {
    show: boolean;
    onHide: () => void;
    assurance: Assurance | null;
    onSave: (a: Assurance) => void;
};

export default function ModifierAssurance({ show, onHide, assurance, onSave }: Props) {
    const [form, setForm] = useState({
        desiganationassurance: "",
        codeassurance: "",
        telephone: "",
        email: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (assurance) {
            setForm({
                desiganationassurance: assurance.desiganationassurance,
                codeassurance: assurance.codeassurance,
                telephone: assurance.telephone || "",
                email: assurance.email || "",
            });
        }
    }, [assurance]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assurance) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/assurances/${assurance._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Erreur lors de la modification");
            const data = await res.json();
            onSave(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Modifier l'assurance</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Form.Group className="mb-2">
                        <Form.Label>Désignation</Form.Label>
                        <Form.Control name="desiganationassurance" value={form.desiganationassurance} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Code</Form.Label>
                        <Form.Control name="codeassurance" value={form.codeassurance} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Téléphone</Form.Label>
                        <Form.Control name="telephone" value={form.telephone} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control name="email" value={form.email} onChange={handleChange} required type="email" />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>Annuler</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? "Modification..." : "Enregistrer"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
