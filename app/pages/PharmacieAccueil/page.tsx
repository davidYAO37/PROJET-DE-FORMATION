"use client";

import { useState } from "react";
import { Container, Button, Card, Row, Col } from "react-bootstrap";
import PharmacieModalPharmAccueil from "./PharmacieModalPharmAccueil";

export default function PharmacieAccueil() {
    const [showModal, setShowModal] = useState(false);
    const [codePrestation, setCodePrestation] = useState("");
    const [initialCode, setInitialCode] = useState("");

    const handleOpenModal = (code?: string) => {
        if (code) {
            setInitialCode(code);
        } else {
            setInitialCode("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setInitialCode("");
        setCodePrestation("");
    };

    const handleQuickSearch = () => {
        const code = prompt("Entrez le code de prestation:");
        if (code) {
            handleOpenModal(code);
        }
    };

    return (
        <Container fluid className="p-4">
            <div className="text-center mb-4">
                <h2 className="text-primary mb-4">FICHE PHARMACIE</h2>
                <p className="text-muted">
                    Gérez les ventes de médicaments et les paiements des patients
                </p>
            </div>

            <Row className="justify-content-center">
                <Col md={10}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body className="text-center p-5">
                            <div className="mb-4">
                                <i className="bi bi-cash-stack display-1 text-primary"></i>
                            </div>
                            <h4 className="mb-3">Bienvenue à la pharmacie</h4>
                            <p className="text-muted mb-4">
                                Cliquez sur le bouton ci-dessous pour commencer une nouvelle transaction
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => handleOpenModal()}
                                className="px-5"
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Nouvelle Transaction
                            </Button>
                        </Card.Body>
                    </Card>

                    {/* Options rapides */}
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Transactions rapides</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={4} className="mb-3">
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => handleOpenModal()}
                                        className="w-100 d-flex align-items-center justify-content-center"
                                    >
                                        <i className="bi bi-search me-2"></i>
                                        Rechercher une consultation
                                    </Button>
                                </Col>
                                <Col md={4} className="mb-3">
                                    <Button
                                        variant="outline-info"
                                        onClick={handleQuickSearch}
                                        className="w-100 d-flex align-items-center justify-content-center"
                                    >
                                        <i className="bi bi-keyboard me-2"></i>
                                        Saisir code prestation
                                    </Button>
                                </Col>
                                <Col md={4} className="mb-3">
                                    <Button
                                        variant="outline-success"
                                        onClick={() => handleOpenModal()}
                                        className="w-100 d-flex align-items-center justify-content-center"
                                    >
                                        <i className="bi bi-clock-history me-2"></i>
                                        Consultations récentes
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal principal avec interface conservée */}
            <PharmacieModalPharmAccueil
                show={showModal}
                onHide={handleCloseModal}
                codePrestation={initialCode}
            />
        </Container>
    );
}
