"use client";

import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Card, Form } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function PaiementInfo({ formData }: Props) {
    return (
        <Card className="mt-3 shadow-sm">
            <Card.Header>Informations Paiement</Card.Header>
            <Card.Body>
                {/* Total facture */}
                <Form.Group className="mb-1">
                    <Form.Label>Total facture</Form.Label>
                    <Form.Control
                        type="number"
                        value={formData.factureTotal}
                        readOnly
                    />
                </Form.Group>


                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="col-6 p-0 me-1">
                        {/* Part Patient */}
                        <Form.Group className="mb-1">
                            <Form.Label>Part Patient</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.Partassure ?? 0}  // ← corrige ici
                                readOnly
                            />
                        </Form.Group>
                    </div>
                    <div className="col-6 p-0 me-1">
                        {/* Part Assurance */}
                        <Form.Group className="mb-1">
                            <Form.Label>Part Assurance</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.partAssurance}
                                readOnly
                            />
                        </Form.Group>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="col-6 p-0 me-1">
                        {/* Surplus */}
                        <Form.Group className="mb-1">
                            <Form.Label>Surplus</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.surplus}
                                readOnly
                            />
                        </Form.Group>
                    </div>
                    <div className="col-6 p-0 me-1">

                        {/* Reste à payer */}
                        <Form.Group className="mb-1">
                            <Form.Label>Reste à payer</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.resteAPayer}
                                readOnly
                            />
                        </Form.Group>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
