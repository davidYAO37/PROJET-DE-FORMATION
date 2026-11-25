"use client";

import { ActeClinique } from "@/types/acteclinique";
import { FamilleActe } from "@/types/familleActe";
import React from "react";
import { Col, Form, InputGroup, Row } from "react-bootstrap";
import {
    FaClipboardList,
    FaCog,
    FaMoneyBillWave,
    FaPlusCircle,
    FaUserMd,
} from "react-icons/fa";

export interface ActeFormState {
    designationacte: string;
    lettreCle: string;
    coefficient: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    MontantAuMed: number;
    ActePourApporteur: boolean;
    MontantAnesthesiste: number;
    MontantAideOperatoire: number;
    IDFAMILLE_ACTE_BIOLOGIE: string;
    consultationviste: boolean;
    ActeNonFacturable: boolean;
    acteAdditionnel: boolean;
    montantAdditionnel: number;
}

export const EMPTY_ACTE_FORM: ActeFormState = {
    designationacte: "",
    lettreCle: "",
    coefficient: 0,
    prixClinique: 0,
    prixMutuel: 0,
    prixPreferentiel: 0,
    MontantAuMed: 0,
    ActePourApporteur: false,
    MontantAnesthesiste: 0,
    MontantAideOperatoire: 0,
    IDFAMILLE_ACTE_BIOLOGIE: "",
    consultationviste: false,
    ActeNonFacturable: false,
    acteAdditionnel: false,
    montantAdditionnel: 0,
};

export function acteToForm(acte: ActeClinique): ActeFormState {
    return {
        designationacte: acte.designationacte || "",
        lettreCle: acte.lettreCle || "",
        coefficient: acte.coefficient || 0,
        prixClinique: acte.prixClinique || 0,
        prixMutuel: acte.prixMutuel || 0,
        prixPreferentiel: acte.prixPreferentiel || 0,
        MontantAuMed: acte.MontantAuMed || 0,
        ActePourApporteur: acte.ActePourApporteur || false,
        MontantAnesthesiste: acte.MontantAnesthesiste || 0,
        MontantAideOperatoire: acte.MontantAideOperatoire || 0,
        IDFAMILLE_ACTE_BIOLOGIE: acte.IDFAMILLE_ACTE_BIOLOGIE || "",
        consultationviste: acte.consultationviste || false,
        ActeNonFacturable: acte.ActeNonFacturable || false,
        acteAdditionnel: acte.acteAdditionnel || false,
        montantAdditionnel: acte.montantAdditionnel || 0,
    };
}

export function cleanActeForm(form: ActeFormState, apporteurActif: boolean) {
    return {
        designationacte: form.designationacte.trim(),
        lettreCle: form.lettreCle.trim(),
        coefficient: Number(form.coefficient),
        prixClinique: Number(form.prixClinique),
        prixMutuel: Number(form.prixMutuel),
        prixPreferentiel: Number(form.prixPreferentiel),
        MontantAuMed: Number(form.MontantAuMed),
        ActePourApporteur: apporteurActif ? Boolean(form.ActePourApporteur) : false,
        MontantAnesthesiste: Number(form.MontantAnesthesiste),
        MontantAideOperatoire: Number(form.MontantAideOperatoire),
        IDFAMILLE_ACTE_BIOLOGIE: form.IDFAMILLE_ACTE_BIOLOGIE || undefined,
        consultationviste: Boolean(form.consultationviste),
        ActeNonFacturable: Boolean(form.ActeNonFacturable),
        acteAdditionnel: Boolean(form.acteAdditionnel),
        montantAdditionnel: form.acteAdditionnel ? Number(form.montantAdditionnel) : undefined,
    };
}

type Props = {
    form: ActeFormState;
    setForm: React.Dispatch<React.SetStateAction<ActeFormState>>;
    famillesActe: FamilleActe[];
    apporteurActif: boolean;
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="border rounded-3 p-3 mb-3 bg-white shadow-sm">
            <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                <span className="me-2 d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10"
                    style={{ width: 28, height: 28 }}>
                    {icon}
                </span>
                {title}
            </h6>
            {children}
        </div>
    );
}

function PrixField({ label, name, value, onChange, required }: {
    label: string;
    name: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}) {
    return (
        <Form.Group>
            <Form.Label className="small fw-semibold text-secondary">{label}</Form.Label>
            <InputGroup size="sm">
                <Form.Control name={name} type="number" min={0} value={value} onChange={onChange} required={required} className="text-end" />
                <InputGroup.Text>FCFA</InputGroup.Text>
            </InputGroup>
        </Form.Group>
    );
}

function OuiNonSelect({ label, value, onChange }: { label: string; value: number | boolean; onChange: (v: boolean) => void }) {
    return (
        <Form.Group>
            <Form.Label className="small fw-semibold text-secondary">{label}</Form.Label>
            <Form.Select size="sm" value={value ? "1" : "0"} onChange={(e) => onChange(e.target.value === "1")}>
                <option value="0">Non</option>
                <option value="1">Oui</option>
            </Form.Select>
        </Form.Group>
    );
}

export default function ActeFormFields({ form, setForm, famillesActe, apporteurActif }: Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "coefficient" || name.startsWith("prix") || name.startsWith("Montant") || name === "montantAdditionnel"
                ? Number(value)
                : value,
        }));
    };

    return (
        <>
            <Section icon={<FaClipboardList size={13} />} title="Informations générales">
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-secondary">Désignation</Form.Label>
                    <Form.Control name="designationacte" value={form.designationacte} onChange={handleChange} placeholder="Ex : Consultation générale" required />
                </Form.Group>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold text-secondary">Lettre Clé</Form.Label>
                            <Form.Control name="lettreCle" value={form.lettreCle} onChange={handleChange} placeholder="Ex : B, K, Z..." required />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold text-secondary">Coefficient</Form.Label>
                            <Form.Control name="coefficient" type="number" value={form.coefficient} onChange={handleChange} required />
                        </Form.Group>
                    </Col>
                </Row>
                {form.lettreCle === "B" && (
                    <Form.Group className="mt-3">
                        <Form.Label className="small fw-semibold text-secondary">Famille Acte</Form.Label>
                        <Form.Select name="IDFAMILLE_ACTE_BIOLOGIE" value={form.IDFAMILLE_ACTE_BIOLOGIE} onChange={handleChange}>
                            <option value="">-- Sélectionner une famille --</option>
                            {famillesActe.map((famille) => (
                                <option key={famille._id} value={famille._id}>{famille.Description}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                )}
            </Section>

            <Section icon={<FaMoneyBillWave size={13} />} title="Tarification">
                <Row className="g-3">
                    <Col md={4}>
                        <PrixField label="Prix Clinique" name="prixClinique" value={form.prixClinique} onChange={handleChange} required />
                    </Col>
                    <Col md={4}>
                        <PrixField label="Prix Mutuel" name="prixMutuel" value={form.prixMutuel} onChange={handleChange} required />
                    </Col>
                    <Col md={4}>
                        <PrixField label="Prix Préférentiel" name="prixPreferentiel" value={form.prixPreferentiel} onChange={handleChange} required />
                    </Col>
                </Row>
            </Section>

            <Section icon={<FaUserMd size={13} />} title="Intervenants & honoraires">
                <Row className="g-3">
                    <Col md={6}>
                        <OuiNonSelect label="Acte pour Médecin ?" value={form.MontantAuMed} onChange={(v) => setForm((p) => ({ ...p, MontantAuMed: v ? 1 : 0 }))} />
                    </Col>
                    {apporteurActif && (
                        <Col md={6}>
                            <OuiNonSelect label="Acte pour Apporteur ?" value={form.ActePourApporteur} onChange={(v) => setForm((p) => ({ ...p, ActePourApporteur: v }))} />
                        </Col>
                    )}
                    <Col md={6}>
                        <OuiNonSelect label="Montant anesthésique" value={form.MontantAnesthesiste} onChange={(v) => setForm((p) => ({ ...p, MontantAnesthesiste: v ? 1 : 0 }))} />
                    </Col>
                    <Col md={6}>
                        <OuiNonSelect label="Montant aide opératoire" value={form.MontantAideOperatoire} onChange={(v) => setForm((p) => ({ ...p, MontantAideOperatoire: v ? 1 : 0 }))} />
                    </Col>
                </Row>
            </Section>

            <Section icon={<FaPlusCircle size={13} />} title="Acte additionnel en consultation">
                <Form.Check
                    type="switch"
                    id="sw-acte-additionnel"
                    label="Proposer cet acte comme acte additionnel sur la fiche consultation"
                    name="acteAdditionnel"
                    checked={form.acteAdditionnel}
                    onChange={(e) => setForm((p) => ({ ...p, acteAdditionnel: e.target.checked }))}
                    className="fw-semibold mb-2"
                />
                {form.acteAdditionnel && (
                    <div className="ms-4 mt-2 border-start border-3 border-primary ps-3">
                        <PrixField
                            label="Montant additionnel — payé intégralement par le patient"
                            name="montantAdditionnel"
                            value={form.montantAdditionnel}
                            onChange={handleChange}
                            required
                        />
                        <Form.Text className="text-muted">
                            Ce montant s'applique uniquement à la part patient (aucune part assurance).
                        </Form.Text>
                    </div>
                )}
            </Section>

            <Section icon={<FaCog size={13} />} title="Options">
                <Row>
                    <Col md={6}>
                        <Form.Check
                            type="switch"
                            id="sw-consultationviste"
                            label="Consultation ou visite"
                            name="consultationviste"
                            checked={form.consultationviste}
                            onChange={(e) => setForm((p) => ({ ...p, consultationviste: e.target.checked }))}
                            className="fw-semibold"
                        />
                    </Col>
                    <Col md={6}>
                        <Form.Check
                            type="switch"
                            id="sw-acte-non-facturable"
                            label="Acte non facturable"
                            name="ActeNonFacturable"
                            checked={form.ActeNonFacturable}
                            onChange={(e) => setForm((p) => ({ ...p, ActeNonFacturable: e.target.checked }))}
                            className="fw-semibold"
                        />
                    </Col>
                </Row>
            </Section>
        </>
    );
}
