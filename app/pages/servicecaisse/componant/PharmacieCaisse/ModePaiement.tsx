'use client';

import { PrescriptionForm } from "@/types/Prescription";
import { Card, Form } from "react-bootstrap";

type Props = {
    formData: PrescriptionForm;
    setFormData: React.Dispatch<React.SetStateAction<PrescriptionForm>>;
    modePaiement: string;
    setModePaiement: (value: string) => void;
    montantEncaisse: number;
    setMontantEncaisse: (value: number) => void;
};

export default function ModePaiement({
    formData,
    setFormData,
    modePaiement,
    setModePaiement,
    montantEncaisse,
    setMontantEncaisse
}: Props) {

    return (
        <Card className="mt-3 shadow-sm">
            <Card.Header>Informations Paiement</Card.Header>
            <Card.Body>

                {/* TOTAL / ASSURANCE / PATIENT */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="col-3 p-0 me-1">
                        <Form.Group>
                            <Form.Label>Total facture</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.Montanttotal ?? 0}
                                readOnly
                            />
                        </Form.Group>
                    </div>

                    <div className="col-3 p-0 me-1">
                        <Form.Group>
                            <Form.Label>Part Assurance</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.PartAssurance ?? 0}
                                readOnly
                            />
                        </Form.Group>
                    </div>

                    <div className="col-3 p-0 me-1">
                        <Form.Group>
                            <Form.Label>Part Patient</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.PartAssure ?? 0}
                                readOnly
                            />
                        </Form.Group>
                    </div>
                </div>

                {/* A REGLER / REMISE */}
                <div className="d-flex justify-content-between align-items-center mb-2 bg-info-subtle p-2 rounded">
                    <Form.Group className="col-3 p-0 me-1">
                        <Form.Label>Montant à régler</Form.Label>
                        <Form.Control
                            type="number"
                            value={formData.PartAssure ?? 0}
                            readOnly
                        />
                    </Form.Group>

                    <Form.Group className="col-3 p-0 me-1">
                        <Form.Label>Réduction (FCFA)</Form.Label>
                        <Form.Control
                            type="number"
                            value={formData.Remise ?? 0}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    Remise: Number(e.target.value) || 0
                                })
                            }
                        />
                    </Form.Group>

                    <Form.Group className="col-6 p-0 me-1 px-3">
                        <Form.Label>Motif de réduction</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={1}
                            value={formData.MotifRemise ?? ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    MotifRemise: e.target.value
                                })
                            }
                        />
                    </Form.Group>
                </div>

                {/* RESTE / MODE / ENCAISSE */}
                <div className="d-flex justify-content-between align-items-center mb-2">

                    <div className="col-3 p-0 me-1">
                        <Form.Group>
                            <Form.Label>Reste à payer</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.Restapayer ?? 0}
                                readOnly
                                size="lg"
                            />
                        </Form.Group>
                    </div>

                    <div className="col-4 p-0 me-1">
                        <Form.Group>
                            <Form.Label>Mode de paiement</Form.Label>
                            <Form.Select
                                size="lg"
                                value={modePaiement}
                                onChange={(e) => setModePaiement(e.target.value)}
                                className="border-info fw-bold"
                            >
                                <option value="">-- Sélectionner --</option>
                                <option value="Espèce">Espèce</option>
                                <option value="Chèque">Chèque</option>
                                <option value="Carte de crédit">Carte de crédit</option>
                                <option value="Caution">Caution</option>
                            </Form.Select>
                        </Form.Group>
                    </div>

                    <div className="col-5 p-0 px-1">
                        <Form.Group>
                            <Form.Label>Montant encaissé</Form.Label>
                            <Form.Control
                                type="number"
                                value={montantEncaisse}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setMontantEncaisse(Number.isNaN(val) ? 0 : Math.max(0, val));
                                }}
                                size="lg"
                                className="text-center fw-bold bg-info-subtle"
                            />
                        </Form.Group>
                    </div>

                </div>

            </Card.Body>
        </Card>
    );
}