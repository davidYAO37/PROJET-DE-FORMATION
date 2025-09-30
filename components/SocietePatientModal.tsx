"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spinner, Form, Alert, Row, Col } from "react-bootstrap";

interface SocieteAssurance {
    _id: string;
    societe: string;
}

interface SocietePatientModalProps {
    show: boolean;
    onHide: () => void;
    assuranceId: string;
    onSelect: (societe: SocieteAssurance) => void;
}

export default function SocietePatientModal({
    show,
    onHide,
    assuranceId,
    onSelect,
}: SocietePatientModalProps) {
    const [societes, setSocietes] = useState<SocieteAssurance[]>([]);
    const [loading, setLoading] = useState(false);
    const [newSociete, setNewSociete] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Charger les sociétés liées à l’assurance
    useEffect(() => {
        if (show && assuranceId) {
            setLoading(true);
            fetch(`/api/ajoutsocietepatient?assuranceId=${assuranceId}`)
                .then((res) => {
                    if (!res.ok) throw new Error("Erreur serveur");
                    return res.json();
                })
                .then((data) => setSocietes(Array.isArray(data) ? data : []))
                .catch((err) => {
                    console.error(err);
                    setErrorMsg("Erreur lors du chargement des sociétés");
                })
                .finally(() => setLoading(false));
        }
    }, [show, assuranceId]);

    // Créer une nouvelle société liée à l'assurance
    const handleAddSociete = async () => {
        if (!newSociete.trim()) {
            setErrorMsg("Veuillez entrer le nom de la société.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/ajoutsocietepatient", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ societe: newSociete, assuranceId }),
            });
            if (!res.ok) throw new Error("Erreur lors de l'ajout de la société");

            // L’API doit renvoyer la liste mise à jour
            const updatedSocietes: SocieteAssurance[] = await res.json();
            setSocietes(updatedSocietes);
            setSuccessMsg("Société ajoutée avec succès ✅");
            setNewSociete("");
            setErrorMsg(null);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Erreur lors de l'ajout");
            setSuccessMsg(null);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Choisir ou créer une société d'assurance</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
                {successMsg && <Alert variant="success">{successMsg}</Alert>}

                {loading ? (
                    <div className="text-center py-3">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <>
                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th>Nom de la société</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {societes.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="text-center text-muted">
                                            Aucune société trouvée
                                        </td>
                                    </tr>
                                )}
                                {societes.map((soc) => (
                                    <tr key={soc._id}>
                                        <td>{soc.societe}</td>
                                        <td className="text-center">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => {
                                                    onSelect(soc);
                                                    onHide();
                                                }}
                                            >
                                                Sélectionner
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <hr />
                        <Form>
                            <Row className="align-items-center">
                                <Col md={8} className="mb-2 mb-md-0">
                                    <Form.Control
                                        placeholder="Nom de la nouvelle société"
                                        value={newSociete}
                                        onChange={(e) => setNewSociete(e.target.value)}
                                    />
                                </Col>
                                <Col md={4} className="d-grid">
                                    <Button
                                        variant="success"
                                        onClick={handleAddSociete}
                                        disabled={saving}
                                    >
                                        {saving ? "Ajout..." : "Ajouter Société"}
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
