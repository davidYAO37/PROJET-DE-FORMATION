"use client";



import { useEffect, useState } from "react";
import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Card, Form } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function PatientInfo({ formData, setFormData }: Props) {
    const [codePrestation, setCodePrestation] = useState("");
    const [patientNom, setPatientNom] = useState("");

    useEffect(() => {
        if (codePrestation.trim() !== "") {
            // Remplacer l'URL par celle de votre API réelle
            fetch(`/api/consultations?codePrestation=${encodeURIComponent(codePrestation)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data && data.patient && data.patient.nom) {
                        setPatientNom(data.patient.nom);
                        setFormData((prev: ExamenHospitalisationForm) => ({ ...prev, patientId: data.patient._id || "" }));
                    } else {
                        setPatientNom("");
                    }
                })
                .catch(() => setPatientNom(""));
        } else {
            setPatientNom("");
        }
    }, [codePrestation, setFormData]);

    return (
        <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-light">Information Patient</Card.Header>
            <Card.Body>
                <Form.Group className="mb-2">
                    <Form.Label>N° Prestation</Form.Label>
                    <Form.Control
                        value={codePrestation}
                        onChange={(e) => setCodePrestation(e.target.value)}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Patient</Form.Label>
                    <Form.Control
                        value={patientNom}
                        readOnly
                    />
                </Form.Group>
            </Card.Body>
        </Card>
    );
}
