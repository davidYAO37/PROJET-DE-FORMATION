"use client";

import { useState } from "react";
import { Acte, ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { Table, Button, Form } from "react-bootstrap";
import ListeAutreActeModal from "./ListeAutreActeModal";

type Props = {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
};

export default function ActesTable({ formData, setFormData }: Props) {
    const [showModal, setShowModal] = useState(false);

    // Mettre à jour un champ
    const updateActe = (index: number, field: keyof Acte, value: string | number) => {
        setFormData((prev) => {
            const newActes = prev.actes.map((acte, i) => {
                if (i !== index) return acte;

                let val: string | number = value;
                if (
                    ["coef", "quantite", "coefAssur", "surplus", "prixUnitaire", "taxe",
                        "prixTotal", "partAssurance", "partAssure", "reliquat", "totalRelicatCoefAssur", "montantMedExecutant"]
                        .includes(field)
                ) {
                    const num = typeof value === "string" ? parseFloat(value) : value;
                    val = isNaN(num) ? 0 : num;
                }

                const updated: Acte = { ...acte, [field]: val } as Acte;

                // recalcul automatique du prixTotal
                updated.prixTotal = updated.coef * updated.quantite * updated.prixUnitaire + updated.surplus;

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

    // Ajouter les actes sélectionnés depuis le modal
    const handleSelectActes = (selectedActes: Acte[]) => {
        setFormData((prev) => ({
            ...prev,
            actes: [...prev.actes, ...selectedActes],
        }));
    };

    return (
        <>
            <h5 className="mt-3">Actes</h5>
            <Table bordered hover size="sm" responsive  >
                <thead >
                    <tr>
                        <th >Date</th>
                        <th >Désignation Acte</th>
                        <th>Lettre Clé</th>
                        <th>Coef</th>
                        <th>Qté</th>
                        <th>Coef Assur</th>
                        <th>Surplus</th>
                        <th>PU</th>
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
                        <tr key={acte._id ?? index}>
                            <td>
                                <Form.Control
                                    type="date"
                                    value={acte.date}
                                    onChange={(e) => updateActe(index, "date", e.target.value)}
                                />
                            </td>
                            <td >
                                <Form.Control
                                    value={acte.designation}
                                    onChange={(e) => updateActe(index, "designation", e.target.value)}
                                    className="w-100"
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
                                    value={acte.partPatient}
                                    onChange={(e) => updateActe(index, "partPatient", e.target.value)}
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

            {/* Bouton pour ouvrir le modal */}
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                + Ajouter Acte
            </Button>

            {/* Modal ListeActes */}
            <ListeAutreActeModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSelect={handleSelectActes}
            />
        </>
    );
}
