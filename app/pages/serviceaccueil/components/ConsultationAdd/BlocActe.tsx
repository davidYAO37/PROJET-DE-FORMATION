"use client";
import { Row, Col, Form, Card, Alert } from "react-bootstrap";
import { Medecin } from "@/types/medecin";
import { Patient } from "@/types/patient";
import { useEffect, useState } from "react";

type BlocActeProps = {
    actes: { _id: string; designationacte: string; prixClinique?: number; prixMutuel?: number; prixPreferentiel?: number; ActeNonFacturable?: boolean }[];
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
    patient: Patient | null;
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
    patient,
}: BlocActeProps) {
    const [warning, setWarning] = useState<string | null>(null);

    // Met à jour automatiquement le montant clinique selon le type patient et l'acte sélectionné
    useEffect(() => {
        if (!selectedActe) return;
        const acte = actes.find(a => a._id === selectedActe);
        if (!acte) return;
        if (assure === "mutualiste") setMontantClinique(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
        else if (assure === "preferentiel") setMontantClinique(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
        else setMontantClinique(Math.round(acte.prixClinique ?? 0));
    }, [selectedActe, actes, assure, setMontantClinique]);

    const handleActeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const acteId = e.target.value;
        setWarning(null);

        if (!acteId) {
            setSelectedActe('');
            return;
        }

        const acte = actes.find(a => a._id === acteId);
        if (!acte) {
            setSelectedActe(acteId);
            return;
        }

        // Acte non facturable : pas de restriction
        if (acte.ActeNonFacturable) {
            setSelectedActe(acteId);
            return;
        }

        // Acte facturable : vérifier la dernière consultation du même acte pour ce patient
        if (!patient?._id) {
            setSelectedActe(acteId);
            return;
        }

        try {
            const res = await fetch(`/api/consultation?patientId=${patient._id}`);
            if (!res.ok) {
                setSelectedActe(acteId);
                return;
            }

            const consultations = await res.json();
            if (!Array.isArray(consultations)) {
                setSelectedActe(acteId);
                return;
            }

            const sameActeConsultations = consultations.filter((c: any) =>
                c.IDACTE === acteId || c.designationC === acte.designationacte
            );

            if (sameActeConsultations.length === 0) {
                setSelectedActe(acteId);
                return;
            }

            // Trier par date décroissante
            sameActeConsultations.sort((a: any, b: any) =>
                new Date(b.Date_consulation).getTime() - new Date(a.Date_consulation).getTime()
            );

            const lastConsultation = sameActeConsultations[0];
            const lastDate = new Date(lastConsultation.Date_consulation);
            const today = new Date();
            const diffTime = today.getTime() - lastDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 15) {
                const dateStr = lastDate.toLocaleDateString();
                setWarning(
                    `Ce patient a déjà bénéficié de la prestation "${acte.designationacte}" le ${dateStr} (il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}). Veuillez choisir une prestation non facturable.`
                );
                setSelectedActe('');
                return;
            }

            setSelectedActe(acteId);
        } catch (error) {
            console.error('Erreur lors de la vérification des consultations:', error);
            setSelectedActe(acteId);
        }
    };

    return (

        <Card className="p-2 mb-2">

            <Row>

                <Col md={5}>
                    <Form.Label>Choisir la prestation</Form.Label>
                    <Form.Select value={selectedActe} onChange={handleActeChange}>
                        <option value="">-- Sélectionner --</option>
                        {actes.map((a) => (
                            <option key={a._id} value={a._id}>{a.designationacte}</option>
                        ))}
                    </Form.Select>
                    {warning && (
                        <Alert variant="warning" className="mt-2 py-2 mb-0">
                            <small>{warning}</small>
                        </Alert>
                    )}
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
                    </Form.Select>
                </Col>
            </Row>
        </Card>
    );
}
