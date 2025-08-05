"use client";
import { ActesClinique } from "@/types/acte";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    acte: ActesClinique | null;
    onSave: (a: ActesClinique) => void;
};

export default function ModifierActe({ show, onHide, acte, onSave }: Props) {
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

    // Remplir le formulaire quand on reçoit un acte
    useEffect(() => {
        if (acte) {
            setForm({
                designationacte: acte.designationacte || "",
                lettreCle: acte.lettreCle || "",
                coefficient: acte.coefficient || 0,
                prixClinique: acte.prixClinique || 0,
                prixMutuel: acte.prixMutuel || 0,
                prixPreferenciel: acte.prixPreferenciel || 0,
            });
        }
    }, [acte]);

    // Réinitialiser le formulaire quand on ferme
    useEffect(() => {
        if (!show) {
            setForm({
                designationacte: "",
                lettreCle: "",
                coefficient: 0,
                prixClinique: 0,
                prixMutuel: 0,
                prixPreferenciel: 0,
            });
            setError("");
        }
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === "coefficient" || name.startsWith("prix") ? Number(value) : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acte) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/actes/${acte._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error("Erreur lors de la modification");

            const data: ActesClinique = await res.json();
            onSave(data);
            onHide(); // Fermer la modal après succès
        } catch (err: any) {
            setError(err.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Modifier l'acte clinique</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Form.Group className="mb-2">
                        <Form.Label>Désignation</Form.Label>
                        <Form.Control
                            name="designationacte"
                            value={form.designationacte}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Lettre Clé</Form.Label>
                        <Form.Control
                            name="lettreCle"
                            value={form.lettreCle}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Coefficient</Form.Label>
                        <Form.Control
                            name="coefficient"
                            type="number"
                            value={form.coefficient}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Prix Clinique</Form.Label>
                        <Form.Control
                            name="prixClinique"
                            type="number"
                            value={form.prixClinique}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Prix Mutuel</Form.Label>
                        <Form.Control
                            name="prixMutuel"
                            type="number"
                            value={form.prixMutuel}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Prix Préférentiel</Form.Label>
                        <Form.Control
                            name="prixPreferenciel"
                            type="number"
                            value={form.prixPreferenciel}
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
