"use client";
import { useState } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { Assurance } from "@/types/assurance";
import SocietePatientModal from "@/components/SocietePatientModal";

type BlocAssuranceProps = {
    assure: string;
    assurances: Assurance[];
    selectedAssurance: string;
    setSelectedAssurance: (val: string) => void;
    matricule: string;
    setMatricule: (val: string) => void;
    taux: string | number;
    setTaux: (val: string | number) => void;
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
    setMatricule,
    taux,
    setTaux,
    numBon,
    setNumBon,
    souscripteur,
    setSouscripteur,
    societePatient,
    setSocietePatient
}: BlocAssuranceProps) {
    // Modal société patient
    const [showSocieteModal, setShowSocieteModal] = useState(false);

    // Callback pour sélection société
    const handleSelectSociete = (societe: { _id: string; societe: string }) => {
        setSocietePatient(societe.societe);
    };

    // Ouvrir le modal quand on sélectionne une assurance
    const handleAssuranceChange = (value: string) => {
        setSelectedAssurance(value);
        if (value) {
            setShowSocieteModal(true);
        }
    };

    return (
        <>
        <Card className="p-3 mb-3 bg-info-subtle">
            <fieldset disabled={assure === "non"} style={assure === "non" ? { opacity: 0.5 } : {}}>
                <Row className="mt-2">
                    <Col md={5}>
                        <Form.Label>Assurance</Form.Label>
                        <Form.Select value={selectedAssurance} onChange={e => handleAssuranceChange(e.target.value)}>
                            <option value="">-- Sélectionner --</option>
                            {assurances.map(a => (
                                <option key={a._id} value={a._id}>{a.desiganationassurance}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Label>Matricule</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={matricule} 
                            onChange={e => setMatricule(e.target.value)}
                        />
                    </Col>
                    <Col md={3}>
                        <Form.Label>Taux (%)</Form.Label>
                        <Form.Control 
                            type="number" 
                            value={taux} 
                            onChange={e => setTaux(e.target.value)}
                        />
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
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Form.Control
                                type="text"
                                value={societePatient}
                                readOnly
                                placeholder="Sélectionner une société"
                                onClick={() => selectedAssurance && setShowSocieteModal(true)}
                                style={{ cursor: selectedAssurance ? 'pointer' : 'not-allowed', background: '#f8f9fa' }}
                            />
                            <Button
                                variant="outline-primary"
                                onClick={() => selectedAssurance && setShowSocieteModal(true)}
                                disabled={!selectedAssurance}
                                title="Choisir une société"
                            >
                                +
                            </Button>
                        </div>
                    </Col>
                </Row>
            </fieldset>
        </Card>

        {/* Modal Société Patient */}
        <SocietePatientModal
            show={showSocieteModal}
            onHide={() => setShowSocieteModal(false)}
            onSelect={handleSelectSociete}
            assuranceId={selectedAssurance}
        />
        </>
    );
}