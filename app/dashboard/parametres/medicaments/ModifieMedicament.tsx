"use client";
import { Pharmacie } from "@/types/pharmacie";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";

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
        TypeArticle: "PHARMACIE",
        ConditionnementAchat: "BOITE" as const,
        QteParConditionnement: 1,
        UniteVente: "",
        PrixAchatConditionnement: 0,
        PrixVenteConditionnement: 0,
        PrixVenteUnite: 0,
        VenteParDetail: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const labelConditionnement = (form.ConditionnementAchat || "conditionnement").toLowerCase();

    // Remplir le formulaire quand on reçoit un medicament
    useEffect(() => {
        if (Medicament) {
            setForm({
                Reference: Medicament.Reference || "",
                Designation: Medicament.Designation || "",
                TypeArticle: Medicament.TypeArticle || "PHARMACIE",
                ConditionnementAchat: (Medicament.ConditionnementAchat as any) || "BOITE",
                QteParConditionnement: Medicament.QteParConditionnement || 1,
                UniteVente: Medicament.UniteVente || "",
                PrixAchatConditionnement: Medicament.PrixAchatConditionnement || 0,
                PrixVenteConditionnement: Medicament.PrixVenteConditionnement || 0,
                PrixVenteUnite: Medicament.PrixVenteUnite || 0,
                VenteParDetail: Medicament.VenteParDetail || false,
            });
        }
    }, [Medicament]);

    // Réinitialiser le formulaire quand on ferme
    useEffect(() => {
        if (!show) {
            setForm({
                Reference: "",
                Designation: "",
                TypeArticle: "PHARMACIE",
                ConditionnementAchat: "BOITE",
                QteParConditionnement: 1,
                UniteVente: "",
                PrixAchatConditionnement: 0,
                PrixVenteConditionnement: 0,
                PrixVenteUnite: 0,
                VenteParDetail: false,
            });
            setError("");
        }
    }, [show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === "number") {
            setForm({ ...form, [name]: value === "" ? 0 : Number(value) });
        } else if (type === "checkbox") {
            setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!Medicament) return;

        setLoading(true);
        setError("");

        try {
            const qteParCond = form.QteParConditionnement || 1;
            const payload = {
                ...form,
                PrixAchat: qteParCond > 0 ? form.PrixAchatConditionnement / qteParCond : 0,
                PrixVente: form.PrixVenteUnite || (qteParCond > 0 ? form.PrixVenteConditionnement / qteParCond : 0),
            };
            const res = await fetch(`/api/medicaments/${Medicament._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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

    const qteParCond = form.QteParConditionnement || 1;
    const prixAchatUnite = qteParCond > 0 ? form.PrixAchatConditionnement / qteParCond : 0;
    const prixVenteUnite = form.PrixVenteUnite || (qteParCond > 0 ? form.PrixVenteConditionnement / qteParCond : 0);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title className="fw-semibold fs-5">Modifier le medicament</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                    <div className="border rounded-3 p-3 mb-3 bg-white shadow-sm">
                        <h6 className="fw-semibold text-secondary mb-3 text-uppercase" style={{ fontSize: 12, letterSpacing: 0.5 }}>Informations générales</h6>
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Designation</Form.Label>
                                    <Form.Control
                                        name="Designation"
                                        value={form.Designation}
                                        onChange={handleChange}
                                        required
                                        className="shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Reference</Form.Label>
                                    <Form.Control
                                        name="Reference"
                                        value={form.Reference}
                                        onChange={handleChange}
                                        required
                                        className="shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="g-3 mt-1">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Type d'article</Form.Label>
                                    <Form.Select name="TypeArticle" value={form.TypeArticle} onChange={handleChange} className="shadow-sm">
                                        <option value="PHARMACIE">Pharmacie</option>
                                        <option value="LABORATOIRE">Laboratoire</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <div className="border rounded-3 p-3 mb-3 bg-light shadow-sm">
                        <h6 className="fw-semibold text-secondary mb-3 text-uppercase" style={{ fontSize: 12, letterSpacing: 0.5 }}>Conditionnement</h6>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Conditionnement d'achat</Form.Label>
                                    <Form.Select name="ConditionnementAchat" value={form.ConditionnementAchat} onChange={handleChange} className="shadow-sm">
                                        <option value="BOITE">Boîte</option>
                                        <option value="FLACON">Flacon</option>
                                        <option value="TUBE">Tube</option>
                                        <option value="AMPLOULE">Ampoule</option>
                                        <option value="SACHET">Sachet</option>
                                        <option value="AUTRE">Autre</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Qté par {labelConditionnement}</Form.Label>
                                    <Form.Control name="QteParConditionnement" type="number" min={1} value={form.QteParConditionnement} onChange={handleChange} required className="shadow-sm" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Unité de vente (détail)</Form.Label>
                                    <Form.Control name="UniteVente" value={form.UniteVente} onChange={handleChange} placeholder="ex: comprimé" list="unites-vente-edit" className="shadow-sm" />
                                    <datalist id="unites-vente-edit">
                                        <option value="Comprimé" />
                                        <option value="Gélule" />
                                        <option value="Ampoule" />
                                        <option value="Sachet" />
                                        <option value="Flacon" />
                                        <option value="Tube" />
                                        <option value="Suppositoire" />
                                        <option value="Ovule" />
                                        <option value="Goutte" />
                                        <option value="ml" />
                                        <option value="g" />
                                        <option value="Unité" />
                                    </datalist>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <div className="border rounded-3 p-3 mb-3 bg-white shadow-sm">
                        <h6 className="fw-semibold text-secondary mb-3 text-uppercase" style={{ fontSize: 12, letterSpacing: 0.5 }}>Tarification</h6>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Prix achat par {labelConditionnement}</Form.Label>
                                    <Form.Control name="PrixAchatConditionnement" type="number" value={form.PrixAchatConditionnement} onChange={handleChange} className="shadow-sm" />
                                    <Form.Text className="text-muted" style={{ fontSize: 11 }}>Prix unitaire estimé : {prixAchatUnite.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} FCFA</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Prix vente par {labelConditionnement}</Form.Label>
                                    <Form.Control name="PrixVenteConditionnement" type="number" value={form.PrixVenteConditionnement} onChange={handleChange} className="shadow-sm" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium text-muted">Prix vente à l'unité (détail)</Form.Label>
                                    <Form.Control name="PrixVenteUnite" type="number" value={form.PrixVenteUnite} onChange={handleChange} className="shadow-sm" />
                                    {form.PrixVenteUnite === 0 && form.PrixVenteConditionnement > 0 && (
                                        <Form.Text className="text-muted" style={{ fontSize: 11 }}>Valeur estimée : {prixVenteUnite.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} FCFA</Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 bg-light shadow-sm">
                        <div>
                            <Form.Label className="small fw-medium text-muted mb-1">Vente au détail autorisée</Form.Label>
                            <div className="text-muted" style={{ fontSize: 12 }}>Permet de vendre l'article unité par unité</div>
                        </div>
                        <Form.Check
                            type="switch"
                            name="VenteParDetail"
                            checked={form.VenteParDetail}
                            onChange={handleChange}
                            className="ms-3"
                            style={{ transform: "scale(1.2)" }}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading} size="sm">Annuler</Button>
                    <Button type="submit" variant="primary" disabled={loading} size="sm" className="px-4">
                        {loading ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
