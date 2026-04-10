"use client";
import { ParamLabo } from "@/types/ParamLabo";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Card, Badge } from "react-bootstrap";
import RTFEditor from "@/components/RTFEditor";

interface Props {
    show: boolean;
    onHide: () => void;
    onAdd: (param: ParamLabo) => void;
}

export default function AjouterParam({ show, onHide, onAdd }: Props) {
    const [form, setForm] = useState({
        NUM_PARAM: null,
        ParamAbrege: "",
        Param_designation: "",
        PlageRefMinNe: null,
        PlageRefMaxNé: null,
        UnitéParam: "",
        PlageMinMaxNé: "",
        PlageMinEnfant: null,
        PlageMaxEnfant: null,
        PlageMinMaxEnfant: "",
        PLageMinFemme: null,
        PlageMaxFemme: null,
        PlageMinMaxFemme: "",
        PlageMinHomme: null,
        PlageMaxHomme: null,
        PlageMinMaxHomme: "",
        ValeurNormale: "",
        ValeurMinNormale: null,
        ValeurMaxNormale: null,
        TypeTexte: false,
        // Ajouter les signes pour chaque section
        SigneNormale: "-",
        SigneNé: "-",
        SigneEnfant: "-",
        SigneFemme: "-",
        SigneHomme: "-",
    });
    const [customUnit, setCustomUnit] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let updatedForm = { ...form };
        
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            updatedForm = { ...updatedForm, [name]: checked };
        } else if (type === "number") {
            // Permettre les valeurs nulles ou zéro
            const numValue = value === "" ? null : Number(value);
            updatedForm = { ...updatedForm, [name]: numValue };
            
            // Logique pour remplir automatiquement les champs Plage Min Max
            if (name === "ValeurMinNormale" || name === "ValeurMaxNormale") {
                const minVal = name === "ValeurMinNormale" ? numValue : updatedForm.ValeurMinNormale;
                const maxVal = name === "ValeurMaxNormale" ? numValue : updatedForm.ValeurMaxNormale;
                if (minVal !== null || maxVal !== null) {
                    updatedForm.ValeurNormale = `${minVal ?? ''}${updatedForm.SigneNormale}${maxVal ?? ''} ${updatedForm.UnitéParam || ""}`.trim();
                }
            }
            
            if (name === "PlageRefMinNe" || name === "PlageRefMaxNé") {
                const minVal = name === "PlageRefMinNe" ? numValue : updatedForm.PlageRefMinNe;
                const maxVal = name === "PlageRefMaxNé" ? numValue : updatedForm.PlageRefMaxNé;
                if (minVal !== null || maxVal !== null) {
                    updatedForm.PlageMinMaxNé = `${minVal ?? ''}${updatedForm.SigneNé}${maxVal ?? ''}`;
                }
            }
            
            if (name === "PlageMinEnfant" || name === "PlageMaxEnfant") {
                const minVal = name === "PlageMinEnfant" ? numValue : updatedForm.PlageMinEnfant;
                const maxVal = name === "PlageMaxEnfant" ? numValue : updatedForm.PlageMaxEnfant;
                if (minVal !== null || maxVal !== null) {
                    updatedForm.PlageMinMaxEnfant = `${minVal ?? ''}${updatedForm.SigneEnfant}${maxVal ?? ''}`;
                }
            }
            
            if (name === "PLageMinFemme" || name === "PlageMaxFemme") {
                const minVal = name === "PLageMinFemme" ? numValue : updatedForm.PLageMinFemme;
                const maxVal = name === "PlageMaxFemme" ? numValue : updatedForm.PlageMaxFemme;
                if (minVal !== null || maxVal !== null) {
                    updatedForm.PlageMinMaxFemme = `${minVal ?? ''}${updatedForm.SigneFemme}${maxVal ?? ''}`;
                }
            }
            
            if (name === "PlageMinHomme" || name === "PlageMaxHomme") {
                const minVal = name === "PlageMinHomme" ? numValue : updatedForm.PlageMinHomme;
                const maxVal = name === "PlageMaxHomme" ? numValue : updatedForm.PlageMaxHomme;
                if (minVal !== null || maxVal !== null) {
                    updatedForm.PlageMinMaxHomme = `${minVal ?? ''}${updatedForm.SigneHomme}${maxVal ?? ''}`;
                }
            }
        } else {
            updatedForm = { ...updatedForm, [name]: value };
            
            // Mettre à jour ValeurNormale si l'unité change
            if (name === "UnitéParam") {
                if (updatedForm.ValeurMinNormale || updatedForm.ValeurMaxNormale) {
                    updatedForm.ValeurNormale = `${updatedForm.ValeurMinNormale}${updatedForm.SigneNormale}${updatedForm.ValeurMaxNormale} ${value}`.trim();
                }
                if (updatedForm.PlageRefMinNe || updatedForm.PlageRefMaxNé) {
                    updatedForm.PlageMinMaxNé = `${updatedForm.PlageRefMinNe}${updatedForm.SigneNé}${updatedForm.PlageRefMaxNé} ${value}`.trim();
                }
                if (updatedForm.PlageMinEnfant || updatedForm.PlageMaxEnfant) {
                    updatedForm.PlageMinMaxEnfant = `${updatedForm.PlageMinEnfant}${updatedForm.SigneEnfant}${updatedForm.PlageMaxEnfant} ${value}`.trim();
                }
                if (updatedForm.PLageMinFemme || updatedForm.PlageMaxFemme) {
                    updatedForm.PlageMinMaxFemme = `${updatedForm.PLageMinFemme}${updatedForm.SigneFemme}${updatedForm.PlageMaxFemme} ${value}`.trim();
                }
                if (updatedForm.PlageMinHomme || updatedForm.PlageMaxHomme) {
                    updatedForm.PlageMinMaxHomme = `${updatedForm.PlageMinHomme}${updatedForm.SigneHomme}${updatedForm.PlageMaxHomme} ${value}`.trim();
                }
            }
            
            // Mettre à jour les champs Plage Min Max si le signe change
            if (name === "SigneNormale" && (updatedForm.ValeurMinNormale || updatedForm.ValeurMaxNormale)) {
                updatedForm.ValeurNormale = `${updatedForm.ValeurMinNormale}${value}${updatedForm.ValeurMaxNormale} ${updatedForm.UnitéParam || ""}`.trim();
            }
            
            if (name === "SigneNé" && (updatedForm.PlageRefMinNe || updatedForm.PlageRefMaxNé)) {
                updatedForm.PlageMinMaxNé = `${updatedForm.PlageRefMinNe}${value}${updatedForm.PlageRefMaxNé} ${updatedForm.UnitéParam || ""}`.trim();
            }
            
            if (name === "SigneEnfant" && (updatedForm.PlageMinEnfant || updatedForm.PlageMaxEnfant)) {
                updatedForm.PlageMinMaxEnfant = `${updatedForm.PlageMinEnfant}${value}${updatedForm.PlageMaxEnfant} ${updatedForm.UnitéParam || ""}`.trim();
            }
            
            if (name === "SigneFemme" && (updatedForm.PLageMinFemme || updatedForm.PlageMaxFemme)) {
                updatedForm.PlageMinMaxFemme = `${updatedForm.PLageMinFemme}${value}${updatedForm.PlageMaxFemme} ${updatedForm.UnitéParam || ""}`.trim();
            }
            
            if (name === "SigneHomme" && (updatedForm.PlageMinHomme || updatedForm.PlageMaxHomme)) {
                updatedForm.PlageMinMaxHomme = `${updatedForm.PlageMinHomme}${value}${updatedForm.PlageMaxHomme} ${updatedForm.UnitéParam || ""}`.trim();
            }
        }
        
        setForm(updatedForm);
    };

    const validateForm = () => {
        if (!form.Param_designation || form.Param_designation.trim() === "") {
            setError("Impossible de valider cette opération");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/paramlabo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Erreur lors de l'ajout");
            const data = await res.json();
            onAdd(data);
            // Reset form
            setForm({
                NUM_PARAM: null,
                ParamAbrege: "",
                Param_designation: "",
                PlageRefMinNe: null,
                PlageRefMaxNé: null,
                UnitéParam: "",
                PlageMinMaxNé: "",
                PlageMinEnfant: null,
                PlageMaxEnfant: null,
                PlageMinMaxEnfant: "",
                PLageMinFemme: null,
                PlageMaxFemme: null,
                PlageMinMaxFemme: "",
                PlageMinHomme: null,
                PlageMaxHomme: null,
                PlageMinMaxHomme: "",
                ValeurNormale: "",
                ValeurMinNormale: null,
                ValeurMaxNormale: null,
                TypeTexte: false,
                SigneNormale: "-",
                SigneNé: "-",
                SigneEnfant: "-",
                SigneFemme: "-",
                SigneHomme: "-",
            });
            onHide();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Ajouter un Paramètre Laboratoire</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
                    
                    {/* Carte Informations Générales */}
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Header className="bg-primary text-white py-3">
                            <h5 className="mb-0 d-flex align-items-center">
                                <i className="bi bi-info-circle me-2"></i>
                                Informations Générales
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Row className="g-3">
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">INDICE</Form.Label>
                                        <Form.Control 
                                            name="NUM_PARAM" 
                                            type="number" 
                                            value={form.NUM_PARAM ?? ""} 
                                            onChange={handleChange}
                                            className="border-0 bg-light"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">NOM ABREGE</Form.Label>
                                        <Form.Control 
                                            name="ParamAbrege" 
                                            value={form.ParamAbrege} 
                                            onChange={handleChange}
                                            className="border-0 bg-light"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">
                                            Désignation <span className="text-danger">*</span>
                                        </Form.Label>
                                        <RTFEditor
                                            value={form.Param_designation}
                                            onChange={(value) => setForm({...form, Param_designation: value})}
                                            label="Désignation du paramètre"
                                            placeholder="Entrez la désignation du paramètre avec formatage riche..."
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">UNITE</Form.Label>
                                        <Form.Control 
                                            name="UnitéParam" 
                                            value={form.UnitéParam} 
                                            onChange={handleChange}
                                            placeholder="10³/mm³, mm³, g/dl..."
                                            list="unit-suggestions"
                                            className="border-0 bg-light"
                                        />
                                        <datalist id="unit-suggestions">
                                            <option value="10³/mm³" />
                                            <option value="mm³" />
                                            <option value="g/dl" />
                                            <option value="g/dlu" />
                                            <option value="%" />
                                            <option value="µ³" />
                                            <option value="pg" />
                                            <option value="10³/µl" />
                                            <option value="10³/u" />
                                            <option value="g/l" />
                                            <option value="mg/l" />
                                            <option value="UI/l" />
                                            <option value="mEq/l" />
                                            <option value="Fl" />
                                            <option value="ml" />
                                            <option value="cm³" />
                                            <option value="Pg" />
                                            <option value="10^6/mm³" />
                                            <option value="10^6/µl" />
                                            <option value="um³" />
                                            <option value="ng/ml" />
                                            <option value="Ul/ml" />
                                            <option value="mm3 de sang" />
                                        </datalist>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Carte Valeur Normale */}
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Header className="bg-success text-white py-3">
                            <h5 className="mb-0 d-flex align-items-center">
                                <i className="bi bi-activity me-2"></i>
                                Valeur Normale
                                <Badge bg="white" text="success" className="ms-auto">Référence principale</Badge>
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Row className="g-3">
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">Valeur Min</Form.Label>
                                        <Form.Control 
                                            name="ValeurMinNormale" 
                                            type="number" 
                                            value={form.ValeurMinNormale ?? ""} 
                                            onChange={handleChange}
                                            className="border-0 bg-light"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={1}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">Signe</Form.Label>
                                        <Form.Select 
                                            name="SigneNormale" 
                                            value={form.SigneNormale} 
                                            onChange={handleChange}
                                            className="border-0 bg-light fw-bold"
                                        >
                                            <option value="-">-</option>
                                            <option value="<=">&lt;=</option>
                                            <option value=">=">&gt;=</option>
                                            <option value="<">&lt;</option>
                                            <option value=">">&gt;</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">Valeur Max</Form.Label>
                                        <Form.Control 
                                            name="ValeurMaxNormale" 
                                            type="number" 
                                            value={form.ValeurMaxNormale ?? ""} 
                                            onChange={handleChange}
                                            className="border-0 bg-light"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={7}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">Résultat Combiné</Form.Label>
                                        <Form.Control 
                                            name="ValeurNormale" 
                                            value={form.ValeurNormale} 
                                            onChange={handleChange}
                                            className="border-0 bg-light fw-semibold"
                                            placeholder="Ex: 10-15 g/dl"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Cartes des Plages Spécifiques */}
                    <Row>
                        <Col md={6}>
                            <Card className="mb-4 shadow-sm border-0 h-100">
                                <Card.Header className="bg-info text-white py-3">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <i className="bi bi-person-baby me-2"></i>
                                        Nouveau Né
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Min</Form.Label>
                                                <Form.Control 
                                                    name="PlageRefMinNe" 
                                                    type="number" 
                                                    value={form.PlageRefMinNe ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Signe</Form.Label>
                                                <Form.Select 
                                                    name="SigneNé" 
                                                    value={form.SigneNé} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-bold"
                                                >
                                                    <option value="-">-</option>
                                                    <option value="<=">&lt;=</option>
                                                    <option value=">=">&gt;=</option>
                                                    <option value="<">&lt;</option>
                                                    <option value=">">&gt;</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Max</Form.Label>
                                                <Form.Control 
                                                    name="PlageRefMaxNé" 
                                                    type="number" 
                                                    value={form.PlageRefMaxNé ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Complète</Form.Label>
                                                <Form.Control 
                                                    name="PlageMinMaxNé" 
                                                    value={form.PlageMinMaxNé} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-semibold"
                                                    placeholder="Ex: 8-12 g/dl"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="mb-4 shadow-sm border-0 h-100">
                                <Card.Header className="bg-warning text-dark py-3">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <i className="bi bi-person-arms-up me-2"></i>
                                        Enfant
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Min</Form.Label>
                                                <Form.Control 
                                                    name="PlageMinEnfant" 
                                                    type="number" 
                                                    value={form.PlageMinEnfant ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Signe</Form.Label>
                                                <Form.Select 
                                                    name="SigneEnfant" 
                                                    value={form.SigneEnfant} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-bold"
                                                >
                                                    <option value="-">-</option>
                                                    <option value="<=">&lt;=</option>
                                                    <option value=">=">&gt;=</option>
                                                    <option value="<">&lt;</option>
                                                    <option value=">">&gt;</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Max</Form.Label>
                                                <Form.Control 
                                                    name="PlageMaxEnfant" 
                                                    type="number" 
                                                    value={form.PlageMaxEnfant ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Complète</Form.Label>
                                                <Form.Control 
                                                    name="PlageMinMaxEnfant" 
                                                    value={form.PlageMinMaxEnfant} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-semibold"
                                                    placeholder="Ex: 10-16 g/dl"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Cartes Adultes */}
                    <Row>
                        <Col md={6}>
                            <Card className="mb-4 shadow-sm border-0 h-100">
                                <Card.Header className="bg-danger text-white py-3">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <i className="bi bi-person-dress me-2"></i>
                                        Femme
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Min</Form.Label>
                                                <Form.Control 
                                                    name="PLageMinFemme" 
                                                    type="number" 
                                                    value={form.PLageMinFemme ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Signe</Form.Label>
                                                <Form.Select 
                                                    name="SigneFemme" 
                                                    value={form.SigneFemme} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-bold"
                                                >
                                                    <option value="-">-</option>
                                                    <option value="<=">&lt;=</option>
                                                    <option value=">=">&gt;=</option>
                                                    <option value="<">&lt;</option>
                                                    <option value=">">&gt;</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Max</Form.Label>
                                                <Form.Control 
                                                    name="PlageMaxFemme" 
                                                    type="number" 
                                                    value={form.PlageMaxFemme ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Complète</Form.Label>
                                                <Form.Control 
                                                    name="PlageMinMaxFemme" 
                                                    value={form.PlageMinMaxFemme} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-semibold"
                                                    placeholder="Ex: 12-16 g/dl"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="mb-4 shadow-sm border-0 h-100">
                                <Card.Header className="bg-secondary text-white py-3">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <i className="bi bi-person me-2"></i>
                                        Homme
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Min</Form.Label>
                                                <Form.Control 
                                                    name="PlageMinHomme" 
                                                    type="number" 
                                                    value={form.PlageMinHomme ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Signe</Form.Label>
                                                <Form.Select 
                                                    name="SigneHomme" 
                                                    value={form.SigneHomme} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-bold"
                                                >
                                                    <option value="-">-</option>
                                                    <option value="<=">&lt;=</option>
                                                    <option value=">=">&gt;=</option>
                                                    <option value="<">&lt;</option>
                                                    <option value=">">&gt;</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Max</Form.Label>
                                                <Form.Control 
                                                    name="PlageMaxHomme" 
                                                    type="number" 
                                                    value={form.PlageMaxHomme ?? ""} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold text-muted small">Plage Complète</Form.Label>
                                                <Form.Control 
                                                    name="PlageMinMaxHomme" 
                                                    value={form.PlageMinMaxHomme} 
                                                    onChange={handleChange}
                                                    className="border-0 bg-light fw-semibold"
                                                    placeholder="Ex: 13-17 g/dl"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Carte Options */}
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-dark text-white py-3">
                            <h5 className="mb-0 d-flex align-items-center">
                                <i className="bi bi-gear me-2"></i>
                                Options Avancées
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Row>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Check 
                                            type="checkbox" 
                                            name="TypeTexte" 
                                            label="Cocher si c'est du texte simple (désactive les champs numériques)" 
                                            checked={form.TypeTexte} 
                                            onChange={handleChange}
                                            className="d-flex align-items-center"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Modal.Body>
                <Modal.Footer className="bg-light border-top-0 px-4 py-3">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading} className="px-4">
                        <i className="bi bi-x-circle me-2"></i>
                        Annuler
                    </Button>
                    <Button type="submit" variant="success" disabled={loading} className="px-4">
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Ajout en cours...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-plus-circle me-2"></i>
                                Ajouter le Paramètre
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}