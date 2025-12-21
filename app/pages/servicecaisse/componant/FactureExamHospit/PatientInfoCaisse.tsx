"use client";

import { defaultFormData, ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { useEffect, useState } from "react";
import { Card, Form } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
    onCodePrestationChange?: (code: string) => void;
    initialPatientP?: string;
};

export default function PatientInfoCaisse({ formData, setFormData, onCodePrestationChange, initialPatientP }: Props) {
    const [CodePrestation, setCodePrestation] = useState(formData.CodePrestation || "");
    const [patientNom, setPatientNom] = useState(initialPatientP || "");
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initialiser le code prestation et charger les données si la prop CodePrestation est fournie
    useEffect(() => {
        if (formData.CodePrestation && formData.CodePrestation !== CodePrestation) {
            setCodePrestation(formData.CodePrestation);
        }
    }, [formData.CodePrestation]);

    // Fonction pour vider complètement le formulaire
    const resetForm = () => {
        setPatientNom("");
        setFormData(defaultFormData);
        setInfoMessage(null);
        setErrorMessage(null);
    };

    useEffect(() => {
        if (CodePrestation.trim() === "") {
            resetForm();
            return;
        }

        fetch(`/api/codeconsultation?CodePrestation=${encodeURIComponent(CodePrestation)}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    resetForm();
                    setErrorMessage(data.error || "Code prestation invalide");
                    return null;
                }
                return data;
            })
            .then((data) => {
                if (!data) return;

                setErrorMessage(null);
                setInfoMessage(data.info || null);

                // Masquer le message info après 10 secondes
                if (data.info) {
                    setTimeout(() => {
                        setInfoMessage(null);
                    }, 10000);
                }

                // Nom complet du patient
                setPatientNom(data.patient || "");

                // Charger les données de la consultation
                setFormData((prev) => ({
                    ...prev,
                    patientId: data.patientId || data.patient || prev.patientId,
                    PatientP: data.patient || "",
                    Assure: data.Assure || data.assure || prev.Assure,
                    medecinPrescripteur: data.medecinPrescripteur || prev.medecinPrescripteur,
                    renseignementclinique: data.designationC || prev.renseignementclinique,
                    societePatient: data.SOCIETE_PATIENT || data.societe || prev.societePatient,
                    assurance: {
                        assuranceId: data.idAssurance || prev.assurance.assuranceId,
                        type: data.Assure || data.assure || prev.assurance.type,
                        taux: data.tauxAssurance ?? data.taux ?? prev.assurance.taux,
                        matricule: data.matricule || prev.assurance.matricule,
                        numeroBon: data.NumBon || data.numeroBon || prev.assurance.numeroBon,
                        societe: data.SOCIETE_PATIENT || data.societe || prev.assurance.societe,
                        numero: data.numero || prev.assurance.numero,
                        adherent: data.Souscripteur || data.souscripteur || prev.assurance.adherent,
                    },
                }));
            })
            .catch(() => {
                resetForm();
                setErrorMessage("Impossible de récupérer les informations, veuillez réessayer.");
            });
    }, [CodePrestation, setFormData]);


    return (
        <Card className="mb-1 shadow-sm">
            <Card.Header className="bg-light">Information Patient</Card.Header>
            <Card.Body>
                {/* N° Prestation */}
                <Form.Group className="mb-1">
                    <Form.Label>N° Prestation</Form.Label>
                    <Form.Control
                        value={CodePrestation || formData.CodePrestation}
                        onChange={(e) => {
                            const v = e.target.value;
                            setCodePrestation(v);
                            if (onCodePrestationChange) onCodePrestationChange(v);
                        }}
                        placeholder="Saisir le code prestation"
                        isInvalid={!!errorMessage}
                        readOnly={!!initialPatientP}
                        style={initialPatientP ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                    />
                    {errorMessage && <div className="invalid-feedback d-block">{errorMessage}</div>}
                </Form.Group>

                {/* Message info */}
                {infoMessage && <div className="alert alert-info mt-2">{infoMessage}</div>}

                {/* Nom du patient */}
                <Form.Group className="mb-1">
                    <Form.Label>Patient</Form.Label>
                    <Form.Control value={patientNom} readOnly />
                </Form.Group>


            </Card.Body>
        </Card>
    );
}
