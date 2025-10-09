"use client";
import { Row, Col, Form, Card, Button, InputGroup } from "react-bootstrap";
import type { Medecin } from "@/types/medecin";
import { useEffect } from "react";
import { FaSearch } from "react-icons/fa";

type BlocActeUpdateProps = {
    actes: { _id: string; designationacte: string; prixClinique?: number; prixMutuel?: number; prixPreferentiel?: number }[];
    selectedActe: string;
    setSelectedActe: (val: string) => void;
    montantClinique: number;
    setMontantClinique: (val: number) => void;
    montantAssurance: number;
    setMontantAssurance: (val: number) => void;
    medecinPrescripteur: Medecin[];
    selectedMedecin: string;
    setSelectedMedecin: (val: string) => void;
    assure: string;
    codePrestation: string;
    setCodePrestation: (val: string) => void;
    onLoadConsultation: () => void;
};

export default function BlocActeUpdate({
    actes,
    selectedActe,
    setSelectedActe,
    montantClinique,
    setMontantClinique,
    montantAssurance,
    setMontantAssurance,
    medecinPrescripteur,
    selectedMedecin,
    setSelectedMedecin,
    assure,
    codePrestation,
    setCodePrestation,
    onLoadConsultation,
}: BlocActeUpdateProps) {
    // Met à jour automatiquement le montant clinique selon le type patient et l'acte sélectionné
    useEffect(() => {
        if (!selectedActe) return;
        const acte = actes.find(a => a._id === selectedActe);
        if (!acte) return;
        if (assure === "mutualiste") setMontantClinique(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
        else if (assure === "preferentiel") setMontantClinique(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
        else setMontantClinique(Math.round(acte.prixClinique ?? 0));
    }, [selectedActe, actes, assure, setMontantClinique]);

    return (
        <Card className="p-3 mb-3 shadow-sm border-primary">
            {/* Champ N°Prestation - Spécifique à la modification */}
            <div className="bg-primary bg-opacity-10 p-3 rounded mb-3">
                <Row className="align-items-center">
                    <Col md={8}>
                        <Form.Label className="fw-bold text-primary mb-2">
                            <i className="bi bi-search me-2"></i>
                            Rechercher une consultation par N° Prestation
                        </Form.Label>
                        <InputGroup size="lg">
                            <InputGroup.Text className="bg-white">
                                <i className="bi bi-file-earmark-text text-primary"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Entrez le code prestation..."
                                value={codePrestation}
                                onChange={(e) => setCodePrestation(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && codePrestation.trim()) {
                                        onLoadConsultation();
                                    }
                                }}
                            />
                            <Button 
                                variant="primary" 
                                onClick={onLoadConsultation}
                                disabled={!codePrestation.trim()}
                                title="Charger la consultation"
                            >
                                <FaSearch className="me-2" />
                                Charger
                            </Button>
                        </InputGroup>
                        <Form.Text className="text-muted d-block mt-2">
                            <i className="bi bi-info-circle me-1"></i>
                            Entrez le N° de prestation et cliquez sur "Charger" (ou appuyez sur Entrée)
                        </Form.Text>
                    </Col>
                </Row>
            </div>

            <h6 className="text-secondary mb-3">
                <i className="bi bi-clipboard-pulse me-2"></i>
                Détails de la Prestation
            </h6>
            <Row>
                <Col md={5}>
                    <Form.Label className="fw-semibold">
                        <i className="bi bi-list-check me-1"></i>
                        Choisir la prestation
                    </Form.Label>
                    <Form.Select 
                        value={selectedActe} 
                        onChange={e => setSelectedActe(e.target.value)}
                        size="lg"
                    >
                        <option value="">-- Sélectionner --</option>
                        {actes.map((a) => (
                            <option key={a._id} value={a._id}>{a.designationacte}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={2}>
                    <Form.Label className="fw-semibold">
                        <i className="bi bi-currency-exchange me-1"></i>
                        Montant Clinique
                    </Form.Label>
                    <Form.Control
                        type="number"
                        value={montantClinique}
                        onChange={(e) => setMontantClinique(Math.round(Number(e.target.value)))}
                        size="lg"
                        className="text-end fw-bold"
                    />
                </Col>
                <Col md={2}>
                    <Form.Label className="fw-semibold">
                        <i className="bi bi-shield-check me-1"></i>
                        Montant Assurance
                    </Form.Label>
                    <Form.Control
                        type="number"
                        value={montantAssurance}
                        onChange={(e) => setMontantAssurance(Math.round(Number(e.target.value)))}
                        size="lg"
                        className="text-end fw-bold"
                    />
                </Col>
                <Col md={3}>
                    <Form.Label className="fw-semibold">
                        <i className="bi bi-person-heart me-1"></i>
                        Médecin Prescripteur
                    </Form.Label>
                    <Form.Select
                        value={selectedMedecin}
                        onChange={e => setSelectedMedecin(e.target.value)}
                        size="lg"
                    >
                        <option value="">-- Sélectionner --</option>
                        {medecinPrescripteur.map(m => (
                            <option key={m._id} value={m._id}>
                                {m.nom} {m.prenoms}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
            </Row>
        </Card>
    );
}