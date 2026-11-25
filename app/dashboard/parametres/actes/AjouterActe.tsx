"use client";

import { ActeClinique } from "@/types/acteclinique";
import { FamilleActe } from "@/types/familleActe";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { FaSave } from "react-icons/fa";
import ActeFormFields, { ActeFormState, EMPTY_ACTE_FORM, cleanActeForm } from "./ActeFormFields";

type Props = {
    show: boolean;
    onHide: () => void;
    onAdd: (a: ActeClinique) => void;
    apporteurActif?: boolean;
};

export default function AjouterActe({ show, onHide, onAdd, apporteurActif = true }: Props) {
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

    useEffect(() => {
        if (!show) {
            setForm(EMPTY_ACTE_FORM);
            setError("");
        }
    }, [show]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/actes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanActeForm(form, apporteurActif)),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erreur lors de l'ajout");
            }
            const data = await res.json();
            const acteData: ActeClinique = {
                _id: data._id,
                designationacte: data.designationacte,
                lettreCle: data.lettreCle,
                coefficient: data.coefficient,
                prixClinique: data.prixClinique,
                prixMutuel: data.prixMutuel,
                prixPreferentiel: data.prixPreferentiel,
                MontantAuMed: data.MontantAuMed,
                ActePourApporteur: data.ActePourApporteur,
                IDFAMILLE_ACTE_BIOLOGIE: data.IDFAMILLE_ACTE_BIOLOGIE,
                consultationviste: data.consultationviste,
                resultatacte: data.resultatacte,
                MontantAnesthesiste: data.MontantAnesthesiste,
                MontantAideOperatoire: data.MontantAideOperatoire,
                IDTYPE_ACTE: data.IDTYPE_ACTE,
                montantacte: data.montantacte,
                TYPEACTE: data.TYPEACTE,
                TypeResultat: data.TypeResultat,
                Interpretation: data.Interpretation,
                ORdonnacementAffichage: data.ORdonnacementAffichage,
                ActeNonFacturable: data.ActeNonFacturable,
                acteAdditionnel: data.acteAdditionnel,
                montantAdditionnel: data.montantAdditionnel,
            };
            onAdd(acteData);
            setForm(EMPTY_ACTE_FORM);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} backdrop="static" keyboard={false} size="lg" centered>
            <Modal.Header closeButton className="text-white" style={{ background: "#00AEEF" }}>
                <Modal.Title className="fs-5">
                    <i className="bi bi-plus-circle me-2"></i>
                    Nouvel acte clinique
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
                    <Button type="submit" variant="success" disabled={loading} className="d-flex align-items-center gap-2">
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : <FaSave />}
                        {loading ? "Enregistrement..." : "Enregistrer l'acte"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
