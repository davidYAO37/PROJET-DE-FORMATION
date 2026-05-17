"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";

// Définition des paramètres du composant
interface PageProps {
    params: {
        id: string;
        CodePrestation?: string;
        Designationtypeacte?: string;
        PatientP?: string;
        prescriptionId?: string;
        dateDebut?: string;
        dateFin?: string;
        remarques?: string;

        [key: string]: string | string[] | number | undefined;
    };
    searchParams: { [key: string]: string | string[] | undefined };
}

// Type pour les props du composant
type PrescriptionPageCaisseProps = {
    params: PageProps['params'];
    searchParams: PageProps['searchParams'];
    onSuccess?: () => void;
};

export default function PrescriptionPageCaisse({
    params,
    searchParams,
    onSuccess
}: PrescriptionPageCaisseProps) {

    const {
        id,
        CodePrestation = "",
        Designationtypeacte = "",
        PatientP = "",
        prescriptionId: propPrescriptionId = "",
        dateDebut = "",
        dateFin = "",
        remarques = ""
    } = params || {};

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const nom = localStorage.getItem("nom_utilisateur");

        // Initialiser les données de base
        setLoading(false);

        if (CodePrestation) {
            // Charger les données si un code prestation est fourni
            console.log("Loading prescription data for:", CodePrestation);
        }
    }, [CodePrestation, propPrescriptionId, dateDebut, dateFin, remarques]);

    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Logique de facturation des prescriptions
            handleSuccess();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="my-4">
            <Row>
                <Col md={12}>
                    <div className="prescription-form">
                        <h5 className="mb-3">Informations de la Prescription</h5>

                        {errorMessage && (
                            <div className="alert alert-danger" role="alert">
                                {errorMessage}
                            </div>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Code Prestation</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={CodePrestation}
                                    disabled
                                    placeholder="Code prestation"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Type d'acte</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={Designationtypeacte}
                                    disabled
                                    placeholder="Type d'acte"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Patient</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={PatientP}
                                    disabled
                                    placeholder="Nom du patient"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Début</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateDebut || ''}
                                    disabled
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Fin</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateFin || ''}
                                    disabled
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Remarques</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={remarques}
                                    disabled
                                    placeholder="Remarques"
                                />
                            </Form.Group>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Traitement..." : "Facturer"}
                            </button>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
