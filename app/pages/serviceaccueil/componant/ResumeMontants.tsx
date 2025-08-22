"use client";
import { Card, Row, Col, Form } from "react-bootstrap";

type ResumeMontantsProps = {
    surplus: number;
    partAssurance: number;
    partPatient: number;
    totalPatient: number;
};

export default function ResumeMontants({ surplus, partAssurance, partPatient, totalPatient }: ResumeMontantsProps) {
    return (
        <Card className="p-3 mb-3 bg-warning-subtle">
            <Row className="mb-3">
                <Col md={4}><Form.Label>Surplus patient:</Form.Label><Form.Control className="bg-danger-subtle" type="text" value={surplus} readOnly /></Col>
                <Col md={4}><Form.Label>Part Assurance:</Form.Label><Form.Control type="text" value={partAssurance} readOnly /></Col>
                <Col md={4}><Form.Label>Part Patient:</Form.Label><Form.Control type="text" value={partPatient} readOnly /></Col>
            </Row>
            <h5 className="text-center mt-2">Total à payer patient : <b>{totalPatient} FCFA</b></h5>
        </Card>
    );
}
