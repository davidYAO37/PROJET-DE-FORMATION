"use client";

import { Card, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function AssuranceInfo({ formData, setFormData }: Props) {
    const [medecins, setMedecins] = useState<{ nom: string; prenoms: string; _id: string }[]>([]);

    useEffect(() => {
        fetch("/api/medecins")
            .then((res) => res.json())
            .then((data) => setMedecins(Array.isArray(data) ? data : []));
    }, []);

    return (
        <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-light">Assuré ?</Card.Header>
            <Card.Body>

                <Form.Group className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="col-3 p-0 me-2">
                            <Form.Label>Taux (%)</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.assurance.taux}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        assurance: { ...formData.assurance, taux: parseFloat(e.target.value) },
                                    })
                                }
                            />
                        </div>
                        <div className="col-9 p-0 me-2">
                            <Form.Label>N° Bon</Form.Label>
                            <Form.Control
                                value={formData.assurance.numeroBon}
                                onChange={(e) =>
                                    setFormData({ ...formData, assurance: { ...formData.assurance, numeroBon: e.target.value } })
                                }
                            />
                        </div>

                    </div>

                </Form.Group>

                <Form.Group className="mb-2">
                    <Form.Label>Matricule</Form.Label>
                    <Form.Control
                        value={formData.assurance.matricule}
                        onChange={(e) =>
                            setFormData({ ...formData, assurance: { ...formData.assurance, matricule: e.target.value } })
                        }
                    />
                </Form.Group>

                <Form.Group className="mb-2">
                    <Form.Label>Société Patient</Form.Label>
                    <Form.Control
                        value={formData.assurance.societe}
                        onChange={(e) =>
                            setFormData({ ...formData, assurance: { ...formData.assurance, societe: e.target.value } })
                        }
                    />
                </Form.Group>

                <Form.Group className="mb-2">
                    <Form.Label>N°</Form.Label>
                    <Form.Control
                        value={formData.assurance.numero}
                        onChange={(e) =>
                            setFormData({ ...formData, assurance: { ...formData.assurance, numero: e.target.value } })
                        }
                    />
                </Form.Group>

                <Form.Group>
                    <Form.Label>Souscripteur/Adhérent principal</Form.Label>
                    <Form.Control
                        value={formData.assurance.adherent}
                        onChange={(e) =>
                            setFormData({ ...formData, assurance: { ...formData.assurance, adherent: e.target.value } })
                        }
                    />
                </Form.Group>

                <Form.Group className="mt-2">
                    <Form.Label>Médecin prescripteur</Form.Label>
                    <Form.Select
                        value={formData.medecinPrescripteur}
                        onChange={(e) => setFormData({ ...formData, medecinPrescripteur: e.target.value })}
                    >
                        <option value="">-- Sélectionner un médecin --</option>
                        {medecins.map((m) => (
                            <option key={m._id} value={m._id}>
                                {m.nom} {m.prenoms}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Card.Body>
        </Card>
    );
}
