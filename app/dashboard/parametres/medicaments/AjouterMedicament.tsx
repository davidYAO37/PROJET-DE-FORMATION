"use client";

import { ActeClinique } from "@/types/acteclinique";
import { FamilleActe } from "@/types/familleActe";
import { Pharmacie } from "@/types/pharmacie";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
        onAdd: (a: Pharmacie) => void;
    };

    export default function AjouterMedicament({ show, onHide, onAdd }: Props) {
        const [form, setForm] = useState({
        Reference: "",
        Designation: "",
        PrixAchat: 0,
        PrixVente: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            // Utilise le endpoint sync pour garantir la cohérence acte/tarif
            const res = await fetch("/api/medicaments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Erreur lors de l'ajout");
            const data = await res.json();
            onAdd(data);
            setForm({ Designation: "", Reference: "", PrixAchat: 0, PrixVente: 0 });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Ajouter un médicament</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Form.Group className="mb-2">
                        <Form.Label>Désignation</Form.Label>
                        <Form.Control name="Designation" value={form.Designation} onChange={handleChange} required />
                    </Form.Group>
                    <Row className="mb-2">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Reference</Form.Label>
                                <Form.Control name="Reference" value={form.Reference} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix d'achat</Form.Label>
                                <Form.Control name="PrixAchat" value={form.PrixAchat} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix de vente</Form.Label>
                                <Form.Control name="PrixVente" type="number" value={form.PrixVente} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
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
