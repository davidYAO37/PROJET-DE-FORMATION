"use client";


import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Card, Table } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function PaiementInfo({ formData }: Props) {
    return (
        <Card className="mt-3 shadow-sm">
            <Card.Header>Informations Paiement</Card.Header>
            <Card.Body>
                <Table size="sm" bordered>
                    <tbody>
                        <tr>
                            <td>Total Facture</td>
                            <td>{formData.factureTotal} CFA</td>
                        </tr>
                        <tr>
                            <td>Reste à payer</td>
                            <td>{formData.resteAPayer} CFA</td>
                        </tr>
                        <tr>
                            <td>Assurance</td>
                            <td>{formData.assurancePart} CFA</td>
                        </tr>
                        <tr>
                            <td>Part Patient</td>
                            <td>{formData.partPatient} CFA</td>
                        </tr>
                        <tr>
                            <td>Surplus</td>
                            <td>{formData.surplus} CFA</td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}
