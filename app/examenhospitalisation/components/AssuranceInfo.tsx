"use client";

import { Card, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Assurance } from "@/types/assurance";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function AssuranceInfo({ formData, setFormData }: Props) {
    const [medecins, setMedecins] = useState<{ nom: string; prenoms: string; _id: string }[]>([]);
    const [assurances, setAssurances] = useState<Assurance[]>([]);

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


    return (
        <Card className="mb-1 shadow-sm">
            <Card.Header className="bg-light">Assuré ?</Card.Header>
            <Card.Body>
                {/* Type Patient (valeur brute du modèle Consultation) */}
                <Form.Group className="mb-3">
                    <Form.Label>Type Patient</Form.Label>
                    <Form.Select
                        name="Assure"
                        value={formData.Assure}
                        onChange={(e) => setFormData({ ...formData, Assure: e.target.value })}                    >
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
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                assurance: { ...formData.assurance, assuranceId: e.target.value },
                            })
                        }
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
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        assurance: {
                                            ...formData.assurance,
                                            taux: parseFloat(e.target.value),
                                        },
                                    })
                                }
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
                    />
                </Form.Group>

                {/* Société Patient */}
                <Form.Group className="mb-1">
                    <Form.Label>Société Patient</Form.Label>
                    <Form.Control
                        value={formData.assurance.societe}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                assurance: { ...formData.assurance, societe: e.target.value },
                            })
                        }
                    />
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
                    />
                </Form.Group>
            </Card.Body>
        </Card>
    );
}
