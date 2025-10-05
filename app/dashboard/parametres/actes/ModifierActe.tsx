"use client";

import { ActeClinique } from "@/types/acteclinique";
import { FamilleActe } from "@/types/familleActe";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    acte: ActeClinique | null;
    onSave: (a: ActeClinique) => void;
};

export default function ModifierActe({ show, onHide, acte, onSave }: Props) {
    const [form, setForm] = useState({
        designationacte: "",
        lettreCle: "",
        coefficient: 0,
        prixClinique: 0,
        prixMutuel: 0,
        prixPreferentiel: 0,
        MontantAuMed: 0,
        IDFAMILLE_ACTE_BIOLOGIE: "",
    });
    const [famillesActe, setFamillesActe] = useState<FamilleActe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Charger les familles d'actes
    useEffect(() => {
        const fetchFamillesActe = async () => {
            try {
                const res = await fetch("/api/familleacte");
                if (res.ok) {
                    const data = await res.json();
                    setFamillesActe(data);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des familles d'actes", err);
            }
        };
        fetchFamillesActe();
    }, []);

    // Remplir le formulaire quand on reçoit un acte
    useEffect(() => {
        if (acte) {
            setForm({
                designationacte: acte.designationacte || "",
                lettreCle: acte.lettreCle || "",
                coefficient: acte.coefficient || 0,
                prixClinique: acte.prixClinique || 0,
                prixMutuel: acte.prixMutuel || 0,
                prixPreferentiel: acte.prixPreferentiel || 0,
                MontantAuMed: acte.MontantAuMed || 0,
                IDFAMILLE_ACTE_BIOLOGIE: acte.IDFAMILLE_ACTE_BIOLOGIE || "",
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
                prixPreferentiel: 0,
                MontantAuMed: 0,
                IDFAMILLE_ACTE_BIOLOGIE: "",
            });
            setError("");
        }
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

            const data: ActeClinique = await res.json();
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
                    <Row className="mb-2">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Lettre Clé</Form.Label>
                                <Form.Control
                                    name="lettreCle"
                                    value={form.lettreCle}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Coefficient</Form.Label>
                                <Form.Control
                                    name="coefficient"
                                    type="number"
                                    value={form.coefficient}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    {form.lettreCle === "B" && (
                        <Form.Group className="mb-2">
                            <Form.Label>Famille Acte</Form.Label>
                            <Form.Select name="IDFAMILLE_ACTE_BIOLOGIE" value={form.IDFAMILLE_ACTE_BIOLOGIE} onChange={handleChange}>
                                <option value="">-- Sélectionner une famille --</option>
                                {famillesActe.map((famille) => (
                                    <option key={famille._id} value={famille._id}>
                                        {famille.Description}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                    <Row className="mb-2">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Clinique</Form.Label>
                                <Form.Control
                                    name="prixClinique"
                                    type="number"
                                    value={form.prixClinique}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Mutuel</Form.Label>
                                <Form.Control
                                    name="prixMutuel"
                                    type="number"
                                    value={form.prixMutuel}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Préférentiel</Form.Label>
                                <Form.Control
                                    name="prixPreferentiel"
                                    type="number"
                                    value={form.prixPreferentiel}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-2">
                        <Form.Label>Acte pour Médecin ?</Form.Label>
                        <Form.Select name="MontantAuMed" value={form.MontantAuMed.toString()} onChange={(e) => setForm({ ...form, MontantAuMed: Number(e.target.value) })}>
                            <option value="0">Non</option>
                            <option value="1">Oui</option>
                        </Form.Select>
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
