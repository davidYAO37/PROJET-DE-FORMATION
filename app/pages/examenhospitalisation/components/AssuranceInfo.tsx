"use client";

import { Card, Form, Button } from "react-bootstrap";
import { useEffect, useState, useRef } from "react";
import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Assurance } from "@/types/assurance";
import SocietePatientModal from "@/components/SocietePatientModal";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
    currentLignes?: any[];
    onRecalculateLines?: () => void;
};

export default function AssuranceInfo({ formData, setFormData, currentLignes = [], onRecalculateLines }: Props) {
    const [medecins, setMedecins] = useState<{ nom: string; prenoms: string; _id: string }[]>([]);
    const [assurances, setAssurances] = useState<Assurance[]>([]);
    const previousAssureStatus = useRef(formData.Assure);
    const previousAssuranceId = useRef(formData.assurance.assuranceId);

    // Modal société patient
    const [showSocieteModal, setShowSocieteModal] = useState(false);

    // Callback pour sélection société
    const handleSelectSociete = (societe: { _id: string; societe: string }) => {
        setFormData({
            ...formData,
            assurance: { ...formData.assurance, societe: societe.societe },
        });
    };

    // Charger médecins
    useEffect(() => {
        fetch("/api/medecins")
            .then((res) => res.json())
            .then((data) => setMedecins(Array.isArray(data) ? data : []));
    }, []);

    // Charger assurances
    useEffect(() => {
        fetch("/api/assurances")
            .then((res) => res.json())
            .then((data) => setAssurances(Array.isArray(data) ? data : []));
    }, []);

    // Fonction pour vérifier les paiements existants
    const checkPaidLines = (): boolean => {
        if (currentLignes && currentLignes.length > 0) {
            const paidLinesCount = currentLignes.filter(ligne => ligne.Statutprescription === 3).length;

            if (paidLinesCount > 0) {
                alert("Veuillez faire annuler les anciens paiements avant cette opération");
                return true; // Il y a des paiements
            }
        }
        return false; // Pas de paiements
    };

    // Fonction pour gérer le changement de statut d'assurance
    const handleAssureStatusChange = (newStatus: string) => {
        // Vérifier s'il y a des lignes avec Statutprescription = 3 (payées)
        if (checkPaidLines()) {
            return;
        }

        // Traiter selon le nouveau statut
        switch (newStatus) {
            case "NON ASSURE":
                setFormData(prev => ({
                    ...prev,
                    Assure: "NON ASSURE",
                    assurance: {
                        ...prev.assurance,
                        taux: 0,
                        matricule: "",
                        numeroBon: "",
                        adherent: "",
                        assuranceId: "",
                        societe: "",
                    },
                    medecinPrescripteur: "",
                }));
                // Mettre à jour la référence
                previousAssureStatus.current = "NON ASSURE";
                previousAssuranceId.current = "";
                // Recalculer les lignes
                if (onRecalculateLines) {
                    setTimeout(() => onRecalculateLines(), 100);
                }
                break;

            case "TARIF MUTUALISTE":
            case "TARIF ASSURE":
                // Vérifier que le taux et l'assurance sont renseignés
                if ((formData.assurance.taux === 0 || !formData.assurance.assuranceId) &&
                    previousAssureStatus.current === "NON ASSURE") {
                    alert("Merci de saisir le taux ou sélectionner l'assurance pour terminer cette modification");
                    // On permet quand même le changement pour qu'ils puissent remplir les champs
                }

                setFormData(prev => ({
                    ...prev,
                    Assure: newStatus,
                }));
                // Mettre à jour la référence
                previousAssureStatus.current = newStatus;
                // Recalculer les lignes si les infos sont complètes
                if (onRecalculateLines && formData.assurance.taux > 0 && formData.assurance.assuranceId) {
                    setTimeout(() => onRecalculateLines(), 100);
                }
                break;
        }
    };


    return (
        <>
            <Card className="mb-1 shadow-sm">
                <Card.Header className="bg-light">Assure?</Card.Header>
                <Card.Body>
                    {/* Type Patient (valeur brute du modèle Consultation) */}
                    <Form.Group className="mb-3">
                        <Form.Label>Type Patient</Form.Label>
                        <Form.Select
                            name="Assure"
                            value={formData.Assure}
                            onChange={(e) => handleAssureStatusChange(e.target.value)}
                        >
                            <option value="NON ASSURE">NON ASSURE</option>
                            <option value="TARIF MUTUALISTE">TARIF MUTUALISTE</option>
                            <option value="TARIF ASSURE">TARIF ASSURE</option>
                        </Form.Select>
                    </Form.Group>
                    {/* Médecin Prescripteur */}
                    <Form.Group className="mt-1">
                        <Form.Label>Médecin prescripteur</Form.Label>
                        <Form.Select
                            value={formData.medecinPrescripteur}
                            onChange={(e) =>
                                setFormData({ ...formData, medecinPrescripteur: e.target.value })
                            }
                        >
                            <option value="">-- Sélectionner un médecin --</option>
                            {medecins.map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.nom} {m.prenoms}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    {/* Sélection Assurance */}
                    <Form.Group className="mb-1">
                        <Form.Label>Assurance</Form.Label>
                        <Form.Select
                            value={formData.assurance.assuranceId || ""}
                            onChange={(e) => {
                                const newAssuranceId = e.target.value;

                                // Vérifier les paiements existants avant de changer
                                if (checkPaidLines()) {
                                    return;
                                }

                                // Vérifier si on passe à MUTUALISTE/ASSURE sans taux
                                /*  if ((formData.Assure === "TARIF MUTUALISTE" || formData.Assure === "TARIF ASSURE") && 
                                     formData.assurance.taux === 0 && newAssuranceId) {
                                     alert("Merci de saisir le taux ou sélectionner l'assurance pour terminer cette modification");
                                     return;
                                 } */

                                setFormData({
                                    ...formData,
                                    assurance: { ...formData.assurance, assuranceId: newAssuranceId },
                                });
                                previousAssuranceId.current = newAssuranceId;

                                // Ouvrir le modal si une assurance est sélectionnée
                                if (newAssuranceId) {
                                    setShowSocieteModal(true);
                                }

                                // Recalculer les lignes si l'assurance change
                                if (onRecalculateLines && newAssuranceId) {
                                    setTimeout(() => onRecalculateLines(), 100);
                                }
                            }}
                            disabled={formData.Assure === "NON ASSURE"}
                        >
                            <option value="">-- Sélectionner --</option>
                            {assurances.map((a) => (
                                <option key={a._id} value={a._id}>
                                    {a.desiganationassurance}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Taux & N° Bon */}
                    <Form.Group className="mb-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="col-4 p-0 me-1">
                                <Form.Label>Taux (%)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.assurance.taux}
                                    onChange={(e) => {
                                        const newTaux = parseFloat(e.target.value) || 0;

                                        // Vérifier les paiements existants avant de changer
                                        if (checkPaidLines()) {
                                            return;
                                        }

                                        // Vérifier si on passe à MUTUALISTE/ASSURE sans assurance
                                        if ((formData.Assure === "TARIF MUTUALISTE" || formData.Assure === "TARIF ASSURE") &&
                                            !formData.assurance.assuranceId && newTaux > 0) {
                                            alert("Merci de saisir le taux ou sélectionner l'assurance pour terminer cette modification");
                                            return;
                                        }

                                        setFormData({
                                            ...formData,
                                            assurance: {
                                                ...formData.assurance,
                                                taux: newTaux,
                                            },
                                        });
                                        // Recalculer les lignes si le taux change
                                        if (onRecalculateLines && newTaux > 0) {
                                            setTimeout(() => onRecalculateLines(), 100);
                                        }
                                    }}
                                    disabled={formData.Assure === "NON ASSURE"}
                                />
                            </div>
                            <div className="col-8 p-0 me-1">
                                <Form.Label>N° Bon</Form.Label>
                                <Form.Control
                                    value={formData.assurance.numeroBon}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            assurance: { ...formData.assurance, numeroBon: e.target.value },
                                        })
                                    }
                                    disabled={formData.Assure === "NON ASSURE"}
                                />
                            </div>
                        </div>
                    </Form.Group>

                    {/* Matricule */}
                    <Form.Group className="mb-1">
                        <Form.Label>Matricule</Form.Label>
                        <Form.Control
                            value={formData.assurance.matricule}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    assurance: { ...formData.assurance, matricule: e.target.value },
                                })
                            }
                            disabled={formData.Assure === "NON ASSURE"}
                        />
                    </Form.Group>

                    {/* Société Patient */}
                    <Form.Group className="mb-1">
                        <Form.Label>Société Patient</Form.Label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Form.Control
                                value={formData.assurance.societe}
                                readOnly
                                placeholder="Sélectionner une société"
                                onClick={() => formData.assurance.assuranceId && setShowSocieteModal(true)}
                                style={{
                                    cursor: formData.assurance.assuranceId ? 'pointer' : 'not-allowed',
                                    background: '#f8f9fa'
                                }}
                                disabled={formData.Assure === "NON ASSURE"}
                            />
                            <Button
                                variant="outline-primary"
                                onClick={() => formData.assurance.assuranceId && setShowSocieteModal(true)}
                                disabled={!formData.assurance.assuranceId || formData.Assure === "NON ASSURE"}
                                title="Choisir une société"
                            >
                                +
                            </Button>
                        </div>
                    </Form.Group>

                    {/* Adhérent */}
                    <Form.Group>
                        <Form.Label>Souscripteur/Adhérent principal</Form.Label>
                        <Form.Control
                            value={formData.assurance.adherent}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    assurance: { ...formData.assurance, adherent: e.target.value },
                                })
                            }
                            disabled={formData.Assure === "NON ASSURE"}
                        />
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* Modal Société Patient */}
            <SocietePatientModal
                show={showSocieteModal}
                onHide={() => setShowSocieteModal(false)}
                onSelect={handleSelectSociete}
                assuranceId={formData.assurance.assuranceId || ""}
            />
        </>
    );
}
