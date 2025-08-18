'use client';

import { useState } from "react";
import { Form, Row, Col, Button, Card } from "react-bootstrap";
import { Patient } from "@/types/patient";

type FicheConsultationProps = {
    patient: Patient | null;
};

export default function FicheConsultation({ patient }: FicheConsultationProps) {
    const [assure, setAssure] = useState("non");

    return (
        <Card className="p-3 shadow-lg">
            <h3 className="text-center text-white p-2 mb-3" style={{ background: "#00AEEF" }}>
                FICHE CONSULTATION
            </h3>

            {/* Informations patient */}
            <Card className="p-3 mb-3">
                <h5>Informations patient</h5>
                <Row className="mb-2">
                    <Col md={4}>
                        <Form.Label className="text-danger fw-bold">Code dossier</Form.Label>
                        <Form.Control type="text" placeholder="Code dossier" defaultValue={patient?.codeDossier || ''} />
                    </Col>
                    <Col md={4}>
                        <Form.Label>Nom</Form.Label>
                        <Form.Control type="text" defaultValue={patient?.nom || ''} />
                    </Col>
                    <Col md={4}>
                        <Form.Label>Sexe</Form.Label>
                        <Form.Select defaultValue={patient?.sexe || 'H'}>
                            <option>H</option>
                            <option>F</option>
                        </Form.Select>
                    </Col>
                </Row>

                <Row className="mb-2">
                    <Col md={2}>
                        <Form.Label>Âge</Form.Label>
                        <Form.Control type="number" defaultValue={patient?.age || ''} />
                    </Col>
                    <Col md={2}>
                        <Form.Label>Né le</Form.Label>
                        <Form.Control type="date" />
                    </Col>
                    <Col md={4}>
                        <Form.Label>Contact</Form.Label>
                        <Form.Control type="text" defaultValue={patient?.contact || ''} />
                    </Col>
                    <Col md={4}>
                        <Form.Label>Groupe sanguin</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                </Row>

                <Row>
                    <Col md={12}>
                        <Form.Label>Habite</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                </Row>
            </Card>

            {/* Assuré */}
            <Card className="p-3 mb-3 bg-warning">
                <h5>Assuré ?</h5>
                <Form.Check
                    inline
                    label="Non Assuré"
                    type="radio"
                    checked={assure === "non"}
                    onChange={() => setAssure("non")}
                />
                <Form.Check
                    inline
                    label="Tarif Mutualiste"
                    type="radio"
                    checked={assure === "mutualiste"}
                    onChange={() => setAssure("mutualiste")}
                />
                <Form.Check
                    inline
                    label="Tarif Assuré"
                    type="radio"
                    checked={assure === "assure"}
                    onChange={() => setAssure("assure")}
                />
            </Card>

            {/* Prestation & Assurance */}
            <Card className="p-3 mb-3">
                <Row>
                    <Col md={6}>
                        <Form.Label>Choisir la prestation</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                    <Col md={6}>
                        <Form.Label>Montant Clinique</Form.Label>
                        <Form.Control type="text" value="0 F CFA" disabled />
                    </Col>
                </Row>

                <Row className="mt-2">
                    <Col md={6}>
                        <Form.Label>Assurance</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                    <Col md={6}>
                        <Form.Label>Société Patient</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                </Row>

                <Row className="mt-2">
                    <Col md={6}>
                        <Form.Label>Souscripteur ou Adhérent principal</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                    <Col md={6}>
                        <Form.Label>Matricule</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                </Row>

                <Row className="mt-2">
                    <Col md={3}>
                        <Form.Label>Taux (%)</Form.Label>
                        <Form.Control type="number" />
                    </Col>
                    <Col md={3}>
                        <Form.Label>N° Bon</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                    <Col md={3}>
                        <Form.Label>Médecin Prescripteur</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                    <Col md={3}>
                        <Form.Label>Apporteur</Form.Label>
                        <Form.Control type="text" />
                    </Col>
                </Row>
            </Card>

            {/* Résumé */}
            <Card className="p-3 mb-3">
                <Row>
                    <Col>
                        <p>Part Assurance: <strong>0</strong></p>
                        <p>Part Assuré: <strong>0</strong></p>
                    </Col>
                    <Col>
                        <p>Montant Assurance: <strong>10 000 000 000</strong></p>
                        <p className="text-danger">Surplus: <strong>0</strong></p>
                    </Col>
                </Row>
                <Button variant="primary" size="lg" className="w-100 fw-bold">
                    Va à la caisse
                </Button>
            </Card>
        </Card>
    );
}
