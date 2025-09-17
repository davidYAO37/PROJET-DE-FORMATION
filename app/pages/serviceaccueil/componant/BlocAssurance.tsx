"use client";
import { Card, Row, Col, Form } from "react-bootstrap";
import { Assurance } from "@/types/assurance";

type BlocAssuranceProps = {
    assure: string;
    assurances: Assurance[];
    selectedAssurance: string;
    setSelectedAssurance: (val: string) => void;
    matricule: string;
    taux: string | number;
    numBon: string;
    setNumBon: (val: string) => void;
    souscripteur: string;
    setSouscripteur: (val: string) => void;
    societePatient: string;
    setSocietePatient: (val: string) => void;
};

export default function BlocAssurance({
    assure,
    assurances,
    selectedAssurance,
    setSelectedAssurance,
    matricule,
    taux,
    numBon,
    setNumBon,
    souscripteur,
    setSouscripteur,
    societePatient,
    setSocietePatient
}: BlocAssuranceProps) {
    return (
        <Card className="p-3 mb-3 bg-info-subtle">
            <fieldset disabled={assure === "non"} style={assure === "non" ? { opacity: 0.5 } : {}}>
                <Row className="mt-2">
                    <Col md={5}>
                        <Form.Label>Assurance</Form.Label>
                        <Form.Select value={selectedAssurance} onChange={e => setSelectedAssurance(e.target.value)}>
                            <option value="">-- Sélectionner --</option>
                            {assurances.map(a => (
                                <option key={a._id} value={a._id}>{a.desiganationassurance}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Label>Matricule</Form.Label>
                        <Form.Control type="text" value={matricule} readOnly />
                    </Col>
                    <Col md={3}>
                        <Form.Label>Taux (%)</Form.Label>
                        <Form.Control type="number" value={taux} readOnly />
                    </Col>
                </Row>

                <Row className="mt-2">
                    <Col md={3}>
                        <Form.Label>N° Bon</Form.Label>
                        <Form.Control type="text" value={numBon} onChange={e => setNumBon(e.target.value)} />
                    </Col>
                    <Col md={5}>
                        <Form.Label>Souscripteur ou Adhérent principal</Form.Label>
                        <Form.Control
                            type="text"
                            value={souscripteur}
                            onChange={e => setSouscripteur(e.target.value)}
                        />
                    </Col>
                    <Col md={4}>
                        <Form.Label>Société Patient</Form.Label>
                        <Form.Control
                            type="text"
                            value={societePatient}
                            onChange={e => setSocietePatient(e.target.value)}
                        />
                    </Col>
                </Row>
            </fieldset>
        </Card>
    );
}