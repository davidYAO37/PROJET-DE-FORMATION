"use client";

import { Acte, ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Table, Button, Form } from "react-bootstrap";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function ActesTable({ formData, setFormData }: Props) {
    // Ajouter un acte vide
    const addActe = () => {
        const newActe: Acte = {
            date: new Date().toISOString().split("T")[0],
            designation: "",
            lettreCle: "",
            coef: 1,
            quantite: 1,
            coefAssur: 0,
            surplus: 0,
            prixUnitaire: 0,
            taxe: 0,
            prixTotal: 0,
            partAssurance: 0,
            partAssure: 0,
            idType: "",
            reliquat: 0,
            totalRelicatCoefAssur: 0,
            montantMedExecutant: 0,
        };

        setFormData((prev) => ({
            ...prev,
            actes: [...prev.actes, newActe],
        }));
    };

    // Mettre à jour un champ
    const updateActe = (index: number, field: keyof Acte, value: string | number) => {
        setFormData((prev) => {
            const newActes = prev.actes.map((acte, i) => {
                if (i !== index) return acte;

                let val: string | number = value;
                if (
                    field === "coef" ||
                    field === "quantite" ||
                    field === "coefAssur" ||
                    field === "surplus" ||
                    field === "prixUnitaire" ||
                    field === "taxe" ||
                    field === "prixTotal" ||
                    field === "partAssurance" ||
                    field === "partAssure" ||
                    field === "reliquat" ||
                    field === "totalRelicatCoefAssur" ||
                    field === "montantMedExecutant"
                ) {
                    const num = typeof value === "string" ? parseFloat(value) : value;
                    val = isNaN(num) ? 0 : num;
                }

                const updated: Acte = { ...acte, [field]: val } as Acte;

                // recalcul automatique du prixTotal si certains champs changent
                updated.prixTotal =
                    updated.coef * updated.quantite * updated.prixUnitaire + updated.taxe + updated.surplus;

                return updated;
            });

            return { ...prev, actes: newActes };
        });
    };

    // Supprimer un acte
    const deleteActe = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            actes: prev.actes.filter((_, i) => i !== index),
        }));
    };

    return (
        <>
            <h5 className="mt-3">Actes</h5>
            <Table bordered hover size="sm" responsive>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Acte</th>
                        <th>Lettre Clé</th>
                        <th>Coef</th>
                        <th>Qté</th>
                        <th>Coef Assur</th>
                        <th>Surplus</th>
                        <th>PU</th>
                        <th>Taxe</th>
                        <th>Total</th>
                        <th>Part Assurance</th>
                        <th>Part Assuré</th>
                        <th>ID Type</th>
                        <th>Reliquat</th>
                        <th>Total Relicat Coef Assur</th>
                        <th>Montant Médecin</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {formData.actes.map((acte, index) => (
                        <tr key={acte.idType ?? index}>
                            <td>
                                <Form.Control
                                    type="date"
                                    value={acte.date}
                                    onChange={(e) => updateActe(index, "date", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    value={acte.designation}
                                    onChange={(e) => updateActe(index, "designation", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    value={acte.lettreCle}
                                    onChange={(e) => updateActe(index, "lettreCle", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.coef}
                                    onChange={(e) => updateActe(index, "coef", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.quantite}
                                    onChange={(e) => updateActe(index, "quantite", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.coefAssur}
                                    onChange={(e) => updateActe(index, "coefAssur", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.surplus}
                                    onChange={(e) => updateActe(index, "surplus", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.prixUnitaire}
                                    onChange={(e) => updateActe(index, "prixUnitaire", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.taxe}
                                    onChange={(e) => updateActe(index, "taxe", e.target.value)}
                                />
                            </td>
                            <td>{acte.prixTotal.toFixed(2)} CFA</td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.partAssurance}
                                    onChange={(e) => updateActe(index, "partAssurance", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.partAssure}
                                    onChange={(e) => updateActe(index, "partAssure", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    value={acte.idType}
                                    onChange={(e) => updateActe(index, "idType", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.reliquat}
                                    onChange={(e) => updateActe(index, "reliquat", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.totalRelicatCoefAssur}
                                    onChange={(e) => updateActe(index, "totalRelicatCoefAssur", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={acte.montantMedExecutant}
                                    onChange={(e) => updateActe(index, "montantMedExecutant", e.target.value)}
                                />
                            </td>
                            <td>
                                <Button variant="danger" size="sm" onClick={() => deleteActe(index)}>
                                    Supprimer
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <Button variant="primary" size="sm" onClick={addActe}>
                + Ajouter Acte
            </Button>
        </>
    );
}
