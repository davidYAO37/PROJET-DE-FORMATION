"use client";

import { Affection } from "@/types/affection";
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    onAdd: (a: Affection) => void;
};

export default function AjouterAffection({ show, onHide, onAdd }: Props) {
    const [form, setForm] = useState({
        designation: "",
        lettreCle: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        // Validation frontend
        if (!form.designation.trim() || !form.lettreCle.trim()) {
            setError("Les champs désignation et lettre clé sont requis");
            setLoading(false);
            return;
        }
        
        try {
            console.log('Envoi des données:', form);
            const res = await fetch("/api/affections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            
            const data = await res.json();
            console.log('Réponse du serveur:', data);
            
            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de l'ajout");
            }
            
            onAdd(data);
            setForm({ designation: "", lettreCle: "" });
            onHide(); // Fermer la modal après succès
        } catch (err: any) {
            console.error('Erreur lors de l\'ajout:', err);
            setError(err.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Ajouter une affection</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Form.Group className="mb-3">
                        <Form.Label>Désignation</Form.Label>
                        <Form.Control name="designation" value={form.designation} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Lettre Clé</Form.Label>
                        <Form.Control name="lettreCle" value={form.lettreCle} onChange={handleChange} required />
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
