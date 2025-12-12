"use client";
import { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
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

export default function BlocAssuranceUpdateCaisse({
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
    // États pour la gestion du chargement et des erreurs
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialLoad, setInitialLoad] = useState(true);
    
    // Modal société patient
    const [showSocieteModal, setShowSocieteModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    // Callback pour sélection société
    const handleSelectSociete = (societe: { _id: string; societe: string }) => {
        try {
            setSocietePatient(societe.societe);
            setModalError(null);
        } catch (err) {
            console.error("Erreur lors de la sélection de la société:", err);
            setModalError("Erreur lors de la sélection de la société");
        }
    };

    // Gestion du changement d'assurance
    const handleAssuranceChange = (value: string) => {
        try {
            setSelectedAssurance(value);
            setSocietePatient(""); // Réinitialiser la société sélectionnée
            setModalError(null);
            
            if (value) {
                setModalLoading(true);
                setShowSocieteModal(true);
            }
        } catch (err) {
            console.error("Erreur lors du changement d'assurance:", err);
            setError("Erreur lors du changement d'assurance");
        } finally {
            setModalLoading(false);
        }
    };

    // Gestion de la fermeture du modal
    const handleModalClose = () => {
        setShowSocieteModal(false);
        setModalError(null);
        setModalLoading(false);
    };

    return (
        <>
            <Card className="p-3 mb-3 shadow-sm" style={{
                background: assure === "non" ? "#f8f9fa" : "linear-gradient(135deg, #e7f3ff 0%, #f0f9ff 100%)",
                border: assure === "non" ? "1px solid #dee2e6" : "2px solid #0d6efd"
            }}>
                <h6 className="text-primary mb-3">
                    <i className="bi bi-shield-fill-check me-2"></i>
                    Informations Assurance
                    {assure === "non" && <span className="badge bg-secondary ms-2">Désactivé</span>}
                </h6>
                <fieldset disabled={assure === "non"} style={assure === "non" ? { opacity: 0.4 } : {}}>
                    <Row className="mt-2">
                        <Col md={5}>
                            <Form.Label className="fw-semibold">
                                <i className="bi bi-building me-1"></i>
                                Assurance
                            </Form.Label>
                            <Form.Select
                                value={selectedAssurance}
                                onChange={e => handleAssuranceChange(e.target.value)}
                                size="lg"
                            >
                                <option value="">-- Sélectionner --</option>
                                {assurances.map(a => (
                                    <option key={a._id} value={a._id}>{a.desiganationassurance}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="fw-semibold">
                                <i className="bi bi-credit-card me-1"></i>
                                Matricule
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={matricule}
                                onChange={e => setMatricule(e.target.value)}
                                size="lg"
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="fw-semibold">
                                <i className="bi bi-percent me-1"></i>
                                Taux (%)
                            </Form.Label>
                            <Form.Control
                                type="number"
                                value={taux}
                                onChange={e => setTaux(e.target.value)}
                                size="lg"
                                className="text-end fw-bold"
                            />
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col md={3}>
                            <Form.Label className="fw-semibold">
                                <i className="bi bi-receipt me-1"></i>
                                N° Bon
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={numBon}
                                onChange={e => setNumBon(e.target.value)}
                                size="lg"
                            />
                        </Col>
                        <Col md={5}>
                            <Form.Label className="fw-semibold">
                                <i className="bi bi-person-vcard me-1"></i>
                                Souscripteur ou Adhérent principal
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={souscripteur}
                                onChange={e => setSouscripteur(e.target.value)}
                                size="lg"
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="fw-semibold">
                                <i className="bi bi-briefcase me-1"></i>
                                Société Patient
                            </Form.Label>
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
                onHide={handleModalClose}
                onSelect={handleSelectSociete}
                assuranceId={selectedAssurance}
            />
            
            {error && (
                <Alert variant="danger" className="mt-3" onClose={() => setError(null)} dismissible>
                    <Alert.Heading>Erreur</Alert.Heading>
                    <p>{error}</p>
                </Alert>
            )}
            
            {modalLoading && (
                <div className="text-center my-3">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                    <p className="mt-2">Chargement des sociétés...</p>
                </div>
            )}
        </>
    );
}