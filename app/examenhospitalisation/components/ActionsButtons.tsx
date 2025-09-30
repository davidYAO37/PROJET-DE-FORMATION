"use client";

import { Button, Row, Col } from "react-bootstrap";

type Props = {
    disabled?: boolean;
    onSubmit?: () => void;
};

export default function ActionsButtons({ disabled = false, onSubmit }: Props) {
    return (
        <Row className="mt-3">
            <Col>
                <Button
                    variant="danger"
                    className="w-100"
                    disabled={disabled} // ✅ bouton désactivé si erreur
                >
                    Ne pas valider
                </Button>
            </Col>
            <Col>
                <Button
                    variant="success"
                    className="w-100"
                    disabled={disabled} // ✅ bouton désactivé si erreur
                    onClick={onSubmit}
                >
                    Allez à la caisse SVP
                </Button>
            </Col>
        </Row>
    );
}
