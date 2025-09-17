"use client";

import { Button, Row, Col } from "react-bootstrap";

export default function ActionsButtons() {
    return (
        <Row className="mt-3">
            <Col>
                <Button variant="danger" className="w-100">Ne pas valider</Button>
            </Col>
            <Col>
                <Button variant="success" className="w-100">Allez à la caisse SVP</Button>
            </Col>
        </Row>
    );
}
