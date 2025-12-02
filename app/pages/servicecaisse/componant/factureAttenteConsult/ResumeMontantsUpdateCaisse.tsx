"use client";
import { Card, Row, Col, Form } from "react-bootstrap";

type ResumeMontantsProps = {
    surplus: number;
    partAssurance: number;
    Partassure: number;
    totalPatient: number;
    montantEncaisse?: number;
    setMontantEncaisse?: (val: number) => void;
    modePaiement?: string;
    setModePaiement?: (val: string) => void;
};

export default function ResumeMontantsUpdateCaisse({
    surplus,
    partAssurance,
    Partassure,
    totalPatient,
    montantEncaisse = 0,
    setMontantEncaisse,
    modePaiement = "Espèce",
    setModePaiement,
}: ResumeMontantsProps) {
    const resteAPayer = Math.max(0, totalPatient - montantEncaisse);

    return (
        <Card
            className="p-4 mb-3 shadow-sm"
            style={{
                background: "linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)",
                border: "2px solid #ffc107",
            }}
        >
            <h6 className="text-warning-emphasis mb-3">
                <i className="bi bi-calculator me-2"></i>
                Résumé des Montants
            </h6>

            <Row className="mb-3 g-3">
                <Col md={3}>
                    <Form.Label className="fw-bold text-danger">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Surplus patient
                    </Form.Label>
                    <Form.Control
                        className="bg-danger bg-opacity-10 border-danger fw-bold text-danger text-end"
                        type="text"
                        value={`${Math.round(surplus)} FCFA`}
                        readOnly
                        size="lg"
                    />
                </Col>

                <Col md={3}>
                    <Form.Label className="fw-bold text-primary">
                        <i className="bi bi-shield-check me-1"></i>
                        Part Assurance
                    </Form.Label>
                    <Form.Control
                        className="bg-primary bg-opacity-10 border-primary fw-bold text-primary text-end"
                        type="text"
                        value={`${Math.round(partAssurance)} FCFA`}
                        readOnly
                        size="lg"
                    />
                </Col>

                <Col md={3}>
                    <Form.Label className="fw-bold text-info">
                        <i className="bi bi-person-circle me-1"></i>
                        Part Patient
                    </Form.Label>
                    <Form.Control
                        className="bg-info bg-opacity-10 border-info fw-bold text-info text-end"
                        type="text"
                        value={`${Math.round(Partassure)} FCFA`}
                        readOnly
                        size="lg"
                    />
                </Col>

                <Col md={3}>
                    <Form.Group className="mb-3">
                        <Form.Label>Mode de Paiement</Form.Label>
                        <Form.Select
                            className="border-info fw-bold text-info"
                            name="modePaiement"
                            value={modePaiement}
                            onChange={(e) => setModePaiement?.(e.target.value)}
                        >
                            <option value="Espèce">Espèce</option>
                            <option value="Chèque">Chèque</option>
                            <option value="Carte de crédit">Carte de crédit</option>
                            <option value="Caution">Caution</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Row
                className="text-center p-3 rounded"
                style={{ background: "rgba(255, 193, 7, 0.2)" }}
            >
                <Col
                    md={5}
                    className="mb-3 d-flex align-items-center justify-content-center"
                >
                    <h5 className="mb-0">
                        <i className="bi bi-cash-coin me-2 text-success"></i>
                        Total à Payer par le Patient:
                        <span className="badge bg-success ms-2 fs-5 px-3 py-2">
                            {Math.round(totalPatient)} FCFA
                        </span>
                    </h5>
                </Col>

                <Col md={3}>
                    <Form.Label className="fw-bold text-info">
                        <i className="bi bi-person-circle me-1"></i>
                        Reste à Payer
                    </Form.Label>
                    <Form.Control
                        className="bg-info bg-opacity-10 border-info fw-bold text-info text-end"
                        type="text"
                        value={`${Math.round(resteAPayer)} FCFA`}
                        readOnly
                        size="lg"
                    />
                </Col>

                <Col md={4}>
                    <Form.Label className="fw-semibold">
                        <i className="bi bi-currency-exchange"></i>
                        Montant Encaissé
                    </Form.Label>
                    <Form.Control
                        type="number"
                        value={montantEncaisse}
                        onChange={(e) =>
                            setMontantEncaisse?.(Math.max(0, Math.round(Number(e.target.value))))
                        }
                        size="lg"
                        className="text-center fw-bold"
                    />
                </Col>
            </Row>
        </Card>
    );
}
