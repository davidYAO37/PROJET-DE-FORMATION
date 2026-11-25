"use client";

import { ActeClinique } from "@/types/acteclinique";
import { FamilleActe } from "@/types/familleActe";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { FaSave } from "react-icons/fa";
import ActeFormFields, { ActeFormState, EMPTY_ACTE_FORM, acteToForm, cleanActeForm } from "./ActeFormFields";

type Props = {
    show: boolean;
    onHide: () => void;
    acte: ActeClinique | null;
    onSave: (a: ActeClinique) => void;
    apporteurActif?: boolean;
};

export default function ModifierActe({ show, onHide, acte, onSave, apporteurActif = true }: Props) {
    const [form, setForm] = useState<ActeFormState>(EMPTY_ACTE_FORM);
    const [famillesActe, setFamillesActe] = useState<FamilleActe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchFamillesActe = async () => {
            try {
                const res = await fetch("/api/familleacte");
                if (res.ok) setFamillesActe(await res.json());
            } catch (err) {
                console.error("Erreur lors du chargement des familles d'actes", err);
            }
        };
        fetchFamillesActe();
    }, []);

    // Remplir le formulaire quand on reçoit un acte
    useEffect(() => {
        if (acte) setForm(acteToForm(acte));
    }, [acte]);

    // Réinitialiser le formulaire quand on ferme
    useEffect(() => {
        if (!show) {
            setForm(EMPTY_ACTE_FORM);
            setError("");
        }
    }, [show]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acte) return;

        setLoading(true);
        setError("");

        try {
            // Utilise l'API acte-tarif-sync pour la modification (garantit la cohérence)
            const res = await fetch("/api/actes/acte-tarif-sync", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...cleanActeForm(form, apporteurActif), id: acte._id }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erreur lors de la modification");
            }

            const data: ActeClinique = await res.json();
            onSave(data);
            onHide();
        } catch (err: any) {
            setError(err.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} backdrop="static" keyboard={false} size="lg" centered>
            <Modal.Header closeButton className="text-white" style={{ background: "#00AEEF" }}>
                <Modal.Title className="fs-5">
                    <i className="bi bi-pencil-square me-2"></i>
                    Modifier l'acte clinique
                    {acte?.designationacte && (
                        <span className="ms-2 fw-normal small opacity-75">— {acte.designationacte}</span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="bg-light">
                    {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                    <ActeFormFields
                        form={form}
                        setForm={setForm}
                        famillesActe={famillesActe}
                        apporteurActif={apporteurActif}
                    />
                </Modal.Body>
                <Modal.Footer className="bg-white">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading}>Annuler</Button>
                    <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center gap-2">
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : <FaSave />}
                        {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
