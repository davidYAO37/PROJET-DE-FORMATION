"use client";

import { useState } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import PatientInfo from "./components/PatientInfo";
import AssuranceInfo from "./components/AssuranceInfo";
import ActesTable from "./components/ActesTable";
import CliniqueInfo from "./components/CliniqueInfo";
import PaiementInfo from "./components/PaiementInfo";
import ActionsButtons from "./components/ActionsButtons";
import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";

export default function HospitalisationPage() {
    const [formData, setFormData] = useState<ExamenHospitalisationForm>({
        patientId: "",
        medecinId: "",
        dateEntree: "",
        dateSortie: "",
        nombreDeJours: 0,
        diagnostic: "",
        observations: "",
        actes: [],
        assurance: {
            type: "",
            taux: 0,
            matricule: "",
            numeroBon: "",
            societe: "",
            numero: "",
            adherent: "",
        },
        medecinPrescripteur: "",
    });

    return (
        <Container fluid className="p-3">
            <h3 className="text-center text-primary mb-3">FICHE DE SAISIE HOSPITALISATION</h3>

            <Row>
                <Col md={4}>
                    <PatientInfo formData={formData} setFormData={setFormData} />
                    <AssuranceInfo formData={formData} setFormData={setFormData} />
                </Col>

                <Col md={8}>
                    <Form>
                        <Row className="mb-2">
                            <Col>
                                <Form.Label>Nature Acte</Form.Label>
                                <Form.Select>
                                    <option>--- Sélectionner ---</option>
                                </Form.Select>
                            </Col>
                            <Col>
                                <Form.Label>Entrée le</Form.Label>
                                <Form.Control type="date" />
                            </Col>
                            <Col>
                                <Form.Label>Sortie le</Form.Label>
                                <Form.Control type="date" />
                            </Col>
                            <Col>
                                <Form.Label>NB (Jrs)</Form.Label>
                                <Form.Control type="number" />
                            </Col>
                        </Row>
                    </Form>

                    <ActesTable formData={formData} setFormData={setFormData} />
                    <CliniqueInfo formData={formData} setFormData={setFormData} />
                    <PaiementInfo formData={formData} setFormData={setFormData} />

                    <ActionsButtons />
                </Col>
            </Row>
        </Container>
    );
}
