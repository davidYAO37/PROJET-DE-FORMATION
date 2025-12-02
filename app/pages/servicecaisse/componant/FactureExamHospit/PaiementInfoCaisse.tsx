"use client";

import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Card, Form } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
    modePaiement: string;
    setModePaiement: (value: string) => void;
    montantEncaisse: number;
    setMontantEncaisse: (value: number) => void;
};

export default function PaiementInfo({
    formData,
    setFormData,
    modePaiement,
    setModePaiement,
    montantEncaisse,
    setMontantEncaisse,
}: Props) {
    return (
        <Card className="mt-3 shadow-sm">
            <Card.Header>Informations Paiement</Card.Header>
            <Card.Body>



                <div className="d-flex justify-content-between align-items-center mb-2">
                    {/* Total facture */}
                    <div className="col-3 p-0 me-1">
                        <Form.Group className="mb-1">
                            <Form.Label>Total facture</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.factureTotal}
                                readOnly
                            />
                        </Form.Group>
                    </div>
                    <div className="col-3 p-0 me-1">
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
                    <div className="col-3 p-0 me-1">
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

                    <div className="col-3 p-0 me-1">
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
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 bg-info">
                    {/* total a payer patient */}
                    <Form.Group className="col-3 p-0 me-1 ">
                        <Form.Label>Montant à Regler</Form.Label>
                        <Form.Control
                            type="number"
                            className="bg-info-subtle"
                            value={formData.TotalapayerPatient}
                            onChange={(e) => setFormData({ ...formData, TotalapayerPatient: Number(e.target.value) })}
                            readOnly
                        />
                    </Form.Group>
                    <Form.Group className="col-3 p-0 me-1">
                        <Form.Label>Reduction (FCFA)</Form.Label>
                        <Form.Control
                            type="number"
                            value={formData.reduction}
                            onChange={(e) => setFormData({ ...formData, reduction: Number(e.target.value) })}

                        />
                    </Form.Group>
                    <Form.Group className="col-6 p-0 me-1 px-3">
                        <Form.Label>Motif de Reduction</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={1}
                            value={formData.MotifRemise}
                            onChange={(e) => setFormData({ ...formData, MotifRemise: e.target.value })}
                        />
                    </Form.Group>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">

                    <div className="col-3 p-0 me-1">
                        {/* Reste à payer */}
                        <Form.Group className="mb-1">
                            <Form.Label>Reste à payer</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.resteAPayer}
                                readOnly
                                size="lg"
                            />
                        </Form.Group>
                    </div>
                    <div className="col-4 p-0 me-1">
                        <Form.Group className="mb-1">
                            <Form.Label>Mode de Paiement</Form.Label>
                            <Form.Select
                                className="border-info fw-bold text-info"
                                size="lg"
                                name="modePaiement"
                                value={modePaiement}
                                onChange={(e) => setModePaiement(e.target.value)}
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
                            <Form.Label>Montant Encaissé</Form.Label>
                            <Form.Control
                                type="number"
                                name="montantEncaisse"
                                value={montantEncaisse}
                                onChange={(e) => {
                                    const parsed = Number(e.target.value);
                                    setMontantEncaisse(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
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
