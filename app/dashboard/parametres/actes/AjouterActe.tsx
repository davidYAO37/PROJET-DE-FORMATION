"use client";
import { ActesClinique } from "@/types/acte";
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    onAdd: (a: ActesClinique) => void;
};

export default function AjouterActe({ show, onHide, onAdd }: Props) {
    const [form, setForm] = useState({
        designationacte: "",
        lettreCle: "",
        coefficient: 0,
        prixClinique: 0,
        prixMutuel: 0,
        prixPreferenciel: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/actes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Erreur lors de l'ajout");
            const data = await res.json();
            onAdd(data);
            setForm({ designationacte: "", lettreCle: "", coefficient: 0, prixClinique: 0, prixMutuel: 0, prixPreferenciel: 0 });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Ajouter un acte clinique</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Form.Group className="mb-2">
                        <Form.Label>Désignation</Form.Label>
                        <Form.Control name="designationacte" value={form.designationacte} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Lettre Clé</Form.Label>
                        <Form.Control name="lettreCle" value={form.lettreCle} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Coefficient</Form.Label>
                        <Form.Control name="coefficient" type="number" value={form.coefficient} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Prix Clinique</Form.Label>
                        <Form.Control name="prixClinique" type="number" value={form.prixClinique} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Prix Mutuel</Form.Label>
                        <Form.Control name="prixMutuel" type="number" value={form.prixMutuel} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Prix Préférentiel</Form.Label>
                        <Form.Control name="prixPreferenciel" type="number" value={form.prixPreferenciel} onChange={handleChange} required />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>Annuler</Button>
                    <Button type="submit" variant="success" disabled={loading}>
                        {loading ? "Ajout..." : "Ajouter"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
