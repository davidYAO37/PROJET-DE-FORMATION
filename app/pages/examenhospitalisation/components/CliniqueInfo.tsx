"use client";

import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Card, Form } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function CliniqueInfo({ formData, setFormData }: Props) {
    return (
        <Card className="mt-3 shadow-sm">
            <Card.Header>Renseignement clinique</Card.Header>
            <Card.Body>
                <Form.Group>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.renseignementclinique}
                        onChange={(e) => setFormData({ ...formData, renseignementclinique: e.target.value })}
                    />
                </Form.Group>
            </Card.Body>
        </Card>
    );
}
