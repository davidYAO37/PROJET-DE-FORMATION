"use client";

import { Affection } from "@/types/affection";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    affection: Affection | null;
    onSave: (a: Affection) => void;
};

export default function ModifierAffection({ show, onHide, affection, onSave }: Props) {
    const [form, setForm] = useState({
        designation: "",
        lettreCle: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Remplir le formulaire quand on reçoit une affection
    useEffect(() => {
        if (affection) {
            setForm({
                designation: affection.designation || "",
                lettreCle: affection.lettreCle || ""
            });
        }
    }, [affection]);

    // Réinitialiser le formulaire quand on ferme
    useEffect(() => {
        if (!show) {
            setForm({
                designation: "",
                lettreCle: ""
            });
            setError("");
        }
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!affection) return;

        // Validation frontend
        if (!form.designation.trim() || !form.lettreCle.trim()) {
            setError("Les champs désignation et lettre clé sont requis");
            return;
        }

        setLoading(true);
        setError("");

        try {
            console.log('Modification de l\'affection ID:', affection._id);
            console.log('Données envoyées:', form);
            
            const res = await fetch(`/api/affections/${affection._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            console.log('Réponse du serveur:', data);

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de la modification");
            }

            onSave(data);
            onHide(); // Fermer la modal après succès
        } catch (err: any) {
            console.error('Erreur lors de la modification:', err);
            setError(err.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Modifier l'affection</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Form.Group className="mb-3">
                        <Form.Label>Désignation</Form.Label>
                        <Form.Control
                            name="designation"
                            value={form.designation}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Lettre Clé</Form.Label>
                        <Form.Control
                            name="lettreCle"
                            value={form.lettreCle}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? "Modification..." : "Enregistrer"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
