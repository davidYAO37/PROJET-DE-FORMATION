"use client";

import { defaultFormData, ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { useEffect, useState } from "react";
import { Card, Form } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
    onCodePrestationChange?: (code: string) => void;
};

export default function PatientInfo({ formData, setFormData, onCodePrestationChange }: Props) {
    const [codePrestation, setCodePrestation] = useState("");
    const [patientNom, setPatientNom] = useState("");
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Fonction pour vider complètement le formulaire
    const resetForm = () => {
        setPatientNom("");
        setFormData(defaultFormData);
        setInfoMessage(null);
        setErrorMessage(null);
    };

    useEffect(() => {
        if (codePrestation.trim() === "") {
            resetForm();
            return;
        }

        fetch(`/api/codeconsultation?Code_Prestation=${encodeURIComponent(codePrestation)}`)
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

                // Nom complet du patient
                setPatientNom(
                    data.patient.Nom + (data.patient.Prenoms ? " " + data.patient.Prenoms : "")
                );

                // Mise à jour du formulaire avec type visiteur (Assure) automatiquement
                setFormData((prev) => ({
                    ...prev,
                    patientId: data.patient._id || "",
                    Assure: data.Assuré || data.assure || "NON ASSURE", // aligné modèle Consultation sans mappage
                    medecinPrescripteur: data.medecinPrescripteur || "",
                    assurance: {
                        ...prev.assurance,
                        assuranceId: data.idAssurance || "",
                        type: data.Assuré || data.assure || "",
                        taux: data.tauxAssurance ?? data.taux ?? 0,
                        matricule: data.matricule || "",
                        numeroBon: data.NumBon || data.numeroBon || "",
                        societe: data.SOCIETE_PATIENT || data.societe || "",
                        numero: data.numero || "",
                        adherent: data.Souscripteur || data.souscripteur || "",
                    },
                }));
            })
            .catch(() => {
                resetForm();
                setErrorMessage("Impossible de récupérer les informations, veuillez réessayer.");
            });
    }, [codePrestation, setFormData]);


    return (
        <Card className="mb-1 shadow-sm">
            <Card.Header className="bg-light">Information Patient</Card.Header>
            <Card.Body>
                {/* N° Prestation */}
                <Form.Group className="mb-1">
                    <Form.Label>N° Prestation</Form.Label>
                    <Form.Control
                        value={codePrestation}
                        onChange={(e) => {
                            const v = e.target.value;
                            setCodePrestation(v);
                            if (onCodePrestationChange) onCodePrestationChange(v);
                        }}
                        placeholder="Saisir le code prestation"
                        isInvalid={!!errorMessage}
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
