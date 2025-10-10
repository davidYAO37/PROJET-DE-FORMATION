"use client";
import { Card, Row, Col, Form } from "react-bootstrap";

type ResumeMontantsProps = {
    surplus: number;
    partAssurance: number;
    partPatient: number;
    totalPatient: number;
};

export default function ResumeMontantsUpdateCaisse({ surplus, partAssurance, partPatient, totalPatient }: ResumeMontantsProps) {
    return (
        <Card className="p-4 mb-3 shadow-sm" style={{
            background: "linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)",
            border: "2px solid #ffc107"
        }}>
            <h6 className="text-warning-emphasis mb-3">
                <i className="bi bi-calculator me-2"></i>
                Résumé des Montants
            </h6>
            <Row className="mb-3 g-3">
                <Col md={4}>
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
                <Col md={4}>
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
                <Col md={4}>
                    <Form.Label className="fw-bold text-info">
                        <i className="bi bi-person-circle me-1"></i>
                        Part Patient
                    </Form.Label>
                    <Form.Control
                        className="bg-info bg-opacity-10 border-info fw-bold text-info text-end"
                        type="text"
                        value={`${Math.round(partPatient)} FCFA`}
                        readOnly
                        size="lg"
                    />
                </Col>
            </Row>
            <div className="text-center p-3 rounded" style={{ background: "rgba(255, 193, 7, 0.2)" }}>
                <h5 className="mb-0">
                    <i className="bi bi-cash-coin me-2 text-success"></i>
                    Total à payer patient :
                    <span className="badge bg-success ms-2 fs-5 px-3 py-2">
                        {Math.round(totalPatient)} FCFA
                    </span>
                </h5>
            </div>
        </Card>
    );
}
