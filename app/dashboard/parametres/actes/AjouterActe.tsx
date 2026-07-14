"use client";

import { ActeClinique } from "@/types/acteclinique";
import { FamilleActe } from "@/types/familleActe";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

type Props = {
    show: boolean;
    onHide: () => void;
    onAdd: (a: ActeClinique) => void;
};

export default function AjouterActe({ show, onHide, onAdd }: Props) {
    const [form, setForm] = useState({
        designationacte: "",
        lettreCle: "",
        coefficient: 0,
        prixClinique: 0,
        prixMutuel: 0,
        prixPreferentiel: 0,
        MontantAuMed: 0,
        MontantAnesthesiste: 0,
        MontantAideOperatoire: 0,
        IDFAMILLE_ACTE_BIOLOGIE: "",
        consultationviste: false,
        ActeNonFacturable: false,
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({ 
            ...form, 
            [name]: name === "coefficient" || name.startsWith("prix") || name.startsWith("Montant") ? Number(value) : value 
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            // Nettoyer le formulaire avant l'envoi
            const cleanedForm = {
                designationacte: form.designationacte.trim(),
                lettreCle: form.lettreCle.trim(),
                coefficient: Number(form.coefficient),
                prixClinique: Number(form.prixClinique),
                prixMutuel: Number(form.prixMutuel),
                prixPreferentiel: Number(form.prixPreferentiel),
                MontantAuMed: Number(form.MontantAuMed),
                MontantAnesthesiste: Number(form.MontantAnesthesiste),
                MontantAideOperatoire: Number(form.MontantAideOperatoire),
                IDFAMILLE_ACTE_BIOLOGIE: form.IDFAMILLE_ACTE_BIOLOGIE || undefined,
                consultationviste: Boolean(form.consultationviste),
                ActeNonFacturable: Boolean(form.ActeNonFacturable),
            };
            
            // Utilise l'API standard pour ajouter un acte
            const res = await fetch("/api/actes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanedForm),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erreur lors de l'ajout");
            }
            const data = await res.json();
            // Convertir les données pour correspondre au type ActeClinique
            const acteData: ActeClinique = {
                _id: data._id,
                designationacte: data.designationacte,
                lettreCle: data.lettreCle,
                coefficient: data.coefficient,
                prixClinique: data.prixClinique,
                prixMutuel: data.prixMutuel,
                prixPreferentiel: data.prixPreferentiel,
                MontantAuMed: data.MontantAuMed,
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
            };
            onAdd(acteData);
            setForm({ designationacte: "", lettreCle: "", coefficient: 0, prixClinique: 0, prixMutuel: 0, prixPreferentiel: 0, MontantAuMed: 0, MontantAnesthesiste: 0, MontantAideOperatoire: 0, IDFAMILLE_ACTE_BIOLOGIE: "", consultationviste: false, ActeNonFacturable: false });
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
                    <Row className="mb-2">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Lettre Clé</Form.Label>
                                <Form.Control name="lettreCle" value={form.lettreCle} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Coefficient</Form.Label>
                                <Form.Control name="coefficient" type="number" value={form.coefficient} onChange={handleChange} required />
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
                                <Form.Control name="prixClinique" type="number" value={form.prixClinique} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Mutuel</Form.Label>
                                <Form.Control name="prixMutuel" type="number" value={form.prixMutuel} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Prix Préférentiel</Form.Label>
                                <Form.Control name="prixPreferentiel" type="number" value={form.prixPreferentiel} onChange={handleChange} required />
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
                    <Row className="mb-2">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Montant anesthésique</Form.Label>
                                <Form.Select 
                                    name="MontantAnesthesiste" 
                                    value={form.MontantAnesthesiste.toString()} 
                                    onChange={(e) => setForm({ ...form, MontantAnesthesiste: Number(e.target.value) })}
                                >
                                    <option value="0">Non</option>
                                    <option value="1">Oui</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Montant aide Opératoire</Form.Label>
                                <Form.Select 
                                    name="MontantAideOperatoire" 
                                    value={form.MontantAideOperatoire.toString()} 
                                    onChange={(e) => setForm({ ...form, MontantAideOperatoire: Number(e.target.value) })}
                                >
                                    <option value="0">Non</option>
                                    <option value="1">Oui</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-2">
                        <Form.Check 
                            type="checkbox" 
                            label="Consultation ou visite" 
                            name="consultationviste"
                            checked={form.consultationviste}
                            onChange={(e) => setForm({ ...form, consultationviste: e.target.checked })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Check 
                            type="checkbox" 
                            label="Acte non facturable" 
                            name="ActeNonFacturable"
                            checked={form.ActeNonFacturable}
                            onChange={(e) => setForm({ ...form, ActeNonFacturable: e.target.checked })}
                        />
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
