'use client';

import { PrescriptionForm } from "@/types/Prescription";
import { Card, Form } from "react-bootstrap";
import { ModeDePaiement } from "@/types/ModeDePaiement";
import { useState, useEffect } from "react";

type Props = {
    formData: PrescriptionForm;
    setFormData: React.Dispatch<React.SetStateAction<PrescriptionForm>>;
    totaux?: {
        montantTotal: number;
        partAssurance: number;
        partAssure: number;
    };
};

export default function ModePaiementPharmAccueil({
    formData,
    setFormData,
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
                            value={Math.max(0, (totaux?.partAssure || 0))}
                            readOnly
                        />
                    </Form.Group>
                    <Form.Group className="col-8 p-0 me-1">
                        <Form.Label>Renseignement clinique</Form.Label>
                        <Form.Control
                            type="textarea"
                            value={formData.Rclinique || ""}
                            onChange={(e) => setFormData({ ...formData, Rclinique: e.target.value })}
                        />
                    </Form.Group>
                   
                </div>
            </Card.Body>
        </Card>
    );
}