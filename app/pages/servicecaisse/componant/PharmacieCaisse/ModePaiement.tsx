'use client';

import { PrescriptionForm } from "@/types/Prescription";
import { Card, Form } from "react-bootstrap";
import { ModeDePaiement } from "@/types/ModeDePaiement";
import { useState, useEffect } from "react";

type Props = {
    formData: PrescriptionForm;
    setFormData: React.Dispatch<React.SetStateAction<PrescriptionForm>>;
    modePaiement: ModeDePaiement["Modepaiement"];
    setModePaiement: React.Dispatch<React.SetStateAction<string>>;
    montantEncaisse: number;
    setMontantEncaisse: (value: number) => void;
    totaux?: {
        montantTotal: number;
        partAssurance: number;
        partAssure: number;
        montantRecu: number;
        resteAPayer: number;
    };
};

export default function ModePaiement({
    formData,
    setFormData,
    modePaiement,
    setModePaiement,
    montantEncaisse,
    setMontantEncaisse,
    totaux
}: Props) {
    const [modesPaiement, setModesPaiement] = useState<ModeDePaiement[]>([]);

    // Récupérer les modes de paiement depuis l'API
    useEffect(() => {
        const fetchModesPaiement = async () => {
            try {
                const response = await fetch('/api/modepaiement');
                const data = await response.json();
                setModesPaiement(data);
            } catch (error) {
                console.error('Erreur lors de la récupération des modes de paiement:', error);
            }
        };

        fetchModesPaiement();
    }, []);

    // Synchroniser les totaux quand ils changent
    useEffect(() => {
        if (totaux) {
            console.log('ModePaiement - Totaux reçus:', totaux);
        }
    }, [totaux]);

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
                                value={totaux?.montantTotal || 0}
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
                                value={totaux?.partAssurance || 0}
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
                                value={totaux?.partAssure || 0}
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
                            value={Math.max(0, (totaux?.partAssure || 0) - (formData.Remise || 0))}
                            readOnly
                        />
                    </Form.Group>
                    <Form.Group className="col-3 p-0 me-1">
                        <Form.Label>Reduction (FCFA)</Form.Label>
                        <Form.Control
                            type="number"
                            value={formData.Remise}
                            onChange={(e) => setFormData({ ...formData, Remise: Number(e.target.value) })}
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
                                value={Math.max(0, (totaux?.partAssure || 0) - (formData.Remise || 0) - montantEncaisse)}
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
                                {modesPaiement.map((mode) => (
                                    <option key={mode._id} value={mode.Modepaiement}>
                                        {mode.Modepaiement}
                                    </option>
                                ))}
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