"use client";
import { Pharmacie } from "@/types/pharmacie";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    Medicament: Pharmacie | null;
    onSave: (a: Pharmacie) => void;
};

export default function ModifierMedicament({ show, onHide, Medicament, onSave }: Props) {
    const [form, setForm] = useState({
        Reference: "",
        Designation: "",
        PrixAchat: 0,
        PrixVente: 0,
       
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    // Remplir le formulaire quand on reçoit un medicament
    useEffect(() => {
        if (Medicament) {
            setForm({
                Reference: Medicament.Reference || "",
                Designation: Medicament.Designation || "",
                PrixAchat: Medicament.PrixAchat || 0,
                PrixVente: Medicament.PrixVente || 0,                
            });
        }
    }, [Medicament]);

    // Réinitialiser le formulaire quand on ferme
    useEffect(() => {
        if (!show) {
            setForm({
                Reference: "",
                Designation: "",
                PrixAchat: 0,
                PrixVente: 0,
            });
            setError("");
        }
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
           const { name, value } = e.target;
           setForm({
               ...form,
               [name]: name === "PrixAchat" || name === "PrixVente" ? Number(value) : value,
           });
       };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!Medicament) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/medicaments/${Medicament._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error("Erreur lors de la modification");

            const data: Pharmacie = await res.json();
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
                <Modal.Title>Modifier le medicament</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <Form.Group className="mb-2">
                        <Form.Label>Designation</Form.Label>
                        <Form.Control
                            name="Designation"
                            value={form.Designation}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Row className="mb-2">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Reference</Form.Label>
                                <Form.Control
                                    name="Reference"
                                    value={form.Reference}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>PrixAchat</Form.Label>
                                <Form.Control
                                    name="PrixAchat"
                                    type="number"
                                    value={form.PrixAchat}
                                    onChange={handleChange}
                                    
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix de vente</Form.Label>
                                <Form.Control
                                    name="PrixVente"
                                    type="number"
                                    value={form.PrixVente}
                                    onChange={handleChange}
                                    
                                />
                            </Form.Group>
                        </Col>          
                    </Row>
                                     
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
