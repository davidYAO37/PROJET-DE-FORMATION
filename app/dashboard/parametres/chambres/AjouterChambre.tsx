"use client";

import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

interface ChambreItem {
    _id: string;
    numero: string;
    type: string;
    service: string;
    tarifJournalier: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    nombreLits: number;
    etat: string;
    observation?: string;
}

type Props = {
    show: boolean;
    onHide: () => void;
    onAdd: (chambre: ChambreItem) => void;
    chambres: ChambreItem[];
};

export default function AjouterChambre({ show, onHide, onAdd, chambres }: Props) {
    const existingTypes = [...new Set(chambres.map(c => c.type).filter(Boolean))];
    const [form, setForm] = useState({
        numero: "",
        type: "standard",
        service: "Hospitalisation",
        prixClinique: 0,
        prixMutuel: 0,
        prixPreferentiel: 0,
        nombreLits: 1,
        observation: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === "nombreLits" || name.startsWith("prix") ? Number(value) : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const typeTrimmed = form.type.trim();
            const typeExists = chambres.some(c => c.type.toLowerCase() === typeTrimmed.toLowerCase());
            if (typeExists) {
                setError(`Le type "${typeTrimmed}" existe déjà. Choisissez un type unique.`);
                setLoading(false);
                return;
            }

            const payload = {
                numero: form.numero.trim(),
                type: typeTrimmed,
                service: form.service.trim(),
                prixClinique: Number(form.prixClinique),
                prixMutuel: Number(form.prixMutuel),
                prixPreferentiel: Number(form.prixPreferentiel),
                nombreLits: Number(form.nombreLits || 1),
                observation: form.observation.trim(),
                etat: "libre",
            };

            const res = await fetch("/api/chambres", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || errorData.details || "Erreur lors de l'ajout");
            }

            const data = await res.json();
            onAdd(data);
            setForm({
                numero: "",
                type: "standard",
                service: "Hospitalisation",
                prixClinique: 0,
                prixMutuel: 0,
                prixPreferentiel: 0,
                nombreLits: 1,
                observation: "",
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Ajouter une chambre</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Row className="mb-2">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Numéro</Form.Label>
                                <Form.Control name="numero" value={form.numero} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Type</Form.Label>
                                <Form.Control
                                    name="type"
                                    list="types-chambre-list"
                                    value={form.type}
                                    onChange={handleChange}
                                    required
                                    placeholder="Saisir ou sélectionner un type"
                                />
                                <datalist id="types-chambre-list">
                                    {existingTypes.map((t) => (
                                        <option key={t} value={t} />
                                    ))}
                                </datalist>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-2">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Service</Form.Label>
                                <Form.Control name="service" value={form.service} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Nombre de lits</Form.Label>
                                <Form.Control name="nombreLits" type="number" min={1} value={form.nombreLits} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-2">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Clinique</Form.Label>
                                <Form.Control name="prixClinique" type="number" value={form.prixClinique} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Mutuel</Form.Label>
                                <Form.Control name="prixMutuel" type="number" value={form.prixMutuel} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Préférentiel</Form.Label>
                                <Form.Control name="prixPreferentiel" type="number" value={form.prixPreferentiel} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-2">
                        <Form.Label>Observation</Form.Label>
                        <Form.Control as="textarea" rows={2} name="observation" value={form.observation} onChange={handleChange} />
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
