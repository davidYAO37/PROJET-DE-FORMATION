"use client";
import { Row, Col, Form, Card } from "react-bootstrap";
import { Medecin } from "@/types/medecin";


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
    medecinExterne: string;
    setMedecinExterne: (val: string) => void;
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
    medecinExterne,
    setMedecinExterne,
    assure,
}: BlocActeProps) {
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
                        onChange={(e) => setMontantClinique(Math.round(Number(e.target.value)))}

                    />

                </Col>
                <Col md={2}>
                    <Form.Label>Montant Assurance</Form.Label>
                    <Form.Control
                        type="number"
                        value={montantAssurance}
                        onChange={(e) => setMontantAssurance(Math.round(Number(e.target.value)))}
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
                        <option value="__EXTERNE__">— Médecin externe (saisie libre) —</option>
                    </Form.Select>
                    {selectedMedecin === "__EXTERNE__" && (
                        <Form.Control
                            className="mt-2"
                            placeholder="Nom du médecin prescripteur externe (ex : Dr Koffi)"
                            value={medecinExterne}
                            onChange={e => setMedecinExterne(e.target.value)}
                        />
                    )}
                </Col>
            </Row>
        </Card>
    );
}
