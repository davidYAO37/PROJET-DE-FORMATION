"use client";
import { Row, Col, Form, Card } from "react-bootstrap";
import { Medecin } from "@/types/medecin";
import { useEffect } from "react";

type BlocActeProps = {
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
};


export default function BlocActe({
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
}: BlocActeProps) {
    // Met à jour automatiquement le montant clinique selon le type patient et l'acte sélectionné
    useEffect(() => {
        if (!selectedActe) return;
        const acte = actes.find(a => a._id === selectedActe);
        if (!acte) return;
        if (assure === "mutualiste") setMontantClinique(acte.prixMutuel ?? acte.prixClinique ?? 0);
        else if (assure === "preferentiel") setMontantClinique(acte.prixPreferentiel ?? acte.prixClinique ?? 0);
        else setMontantClinique(acte.prixClinique ?? 0);
    }, [selectedActe, actes, assure, setMontantClinique]);

    return (

        <Card className="p-2 mb-2">

            <Row>

                <Col md={5}>
                    <Form.Label>Choisir la prestation</Form.Label>
                    <Form.Select value={selectedActe} onChange={e => setSelectedActe(e.target.value)}>
                        <option value="">-- Sélectionner --</option>
                        {actes.map((a) => (
                            <option key={a._id} value={a._id}>{a.designationacte}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={2}>
                    <Form.Label>Montant Clinique</Form.Label>
                    <Form.Control
                        type="number"
                        value={montantClinique}
                        onChange={(e) => setMontantClinique(Number(e.target.value))}

                    />

                </Col>
                <Col md={2}>
                    <Form.Label>Montant Assurance</Form.Label>
                    <Form.Control
                        type="number"
                        value={montantAssurance}
                        onChange={(e) => setMontantAssurance(Number(e.target.value))}
                    />
                </Col>
                <Col md={3}>
                    <Form.Label>Médecin Prescripteur</Form.Label>
                    <Form.Select
                        value={selectedMedecin}
                        onChange={e => setSelectedMedecin(e.target.value)}
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
