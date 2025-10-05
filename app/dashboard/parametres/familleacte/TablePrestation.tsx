"use client";

import { useState, useEffect } from "react";
import { Table, Button, Form } from "react-bootstrap";
import { FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";

interface ActePrestation {
    _id: string;
    designationacte: string;
    lettreCle: string;
    coefficient: number;
    IDFAMILLE_ACTE_BIOLOGIE?: string;
    ORdonnacementAffichage?: number;
}

interface Props {
    familleId: string | null;
}

export default function TablePrestation({ familleId }: Props) {
    const [prestations, setPrestations] = useState<ActePrestation[]>([]);
    const [actesDisponibles, setActesDisponibles] = useState<ActePrestation[]>([]);
    const [loading, setLoading] = useState(false);

    // Charger tous les actes disponibles
    useEffect(() => {
        const fetchActes = async () => {
            try {
                const res = await fetch("/api/actes");
                if (res.ok) {
                    const data = await res.json();
                    setActesDisponibles(data);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des actes", err);
            }
        };
        fetchActes();
    }, []);

    // Charger les actes liés à la famille sélectionnée
    useEffect(() => {
        if (!familleId) {
            setPrestations([]);
            return;
        }

        const fetchPrestations = async () => {
            try {
                const res = await fetch(`/api/actes`);
                if (res.ok) {
                    const data = await res.json();
                    // Filtrer et trier par ordre d'affichage
                    const sorted = data
                        .filter((a: ActePrestation) => a.IDFAMILLE_ACTE_BIOLOGIE === familleId)
                        .sort((a: ActePrestation, b: ActePrestation) => 
                            (a.ORdonnacementAffichage || 0) - (b.ORdonnacementAffichage || 0)
                        );
                    setPrestations(sorted);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des prestations", err);
            }
        };
        fetchPrestations();
    }, [familleId]);

    // Ajouter un acte à la liste
    const handleActeSelect = async (designation: string, index: number) => {
        if (!designation || !familleId) return;

        const acte = actesDisponibles.find(a => a.designationacte === designation);
        if (!acte) return;

        // Mettre à jour la ligne
        const newPrestations = [...prestations];
        newPrestations[index] = {
            ...acte,
            IDFAMILLE_ACTE_BIOLOGIE: familleId,
            ORdonnacementAffichage: index + 1
        };
        setPrestations(newPrestations);
    };

    // Ajouter une nouvelle ligne vide
    const handleAddRow = () => {
        setPrestations([...prestations, {
            _id: "",
            designationacte: "",
            lettreCle: "",
            coefficient: 0,
            IDFAMILLE_ACTE_BIOLOGIE: familleId || "",
            ORdonnacementAffichage: prestations.length + 1
        }]);
    };

    // Déplacer une ligne vers le haut
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newPrestations = [...prestations];
        [newPrestations[index - 1], newPrestations[index]] = [newPrestations[index], newPrestations[index - 1]];
        // Réorganiser les numéros d'ordre
        newPrestations.forEach((p, i) => p.ORdonnacementAffichage = i + 1);
        setPrestations(newPrestations);
    };

    // Déplacer une ligne vers le bas
    const handleMoveDown = (index: number) => {
        if (index === prestations.length - 1) return;
        const newPrestations = [...prestations];
        [newPrestations[index], newPrestations[index + 1]] = [newPrestations[index + 1], newPrestations[index]];
        // Réorganiser les numéros d'ordre
        newPrestations.forEach((p, i) => p.ORdonnacementAffichage = i + 1);
        setPrestations(newPrestations);
    };

    // Supprimer un acte de la famille
    const handleDelete = async (index: number) => {
        if (!window.confirm("Voulez-vous retirer cet acte ?")) return;

        const acte = prestations[index];
        if (acte._id) {
            try {
                // Retirer l'acte de la famille
                await fetch(`/api/actes/${acte._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...acte,
                        IDFAMILLE_ACTE_BIOLOGIE: "",
                        ORdonnacementAffichage: 0
                    })
                });
                alert("Acte retiré avec succès");
            } catch (err) {
                console.error("Erreur lors de la suppression", err);
            }
        }
        
        const newPrestations = prestations.filter((_, i) => i !== index);
        // Réorganiser les numéros d'ordre
        newPrestations.forEach((p, i) => p.ORdonnacementAffichage = i + 1);
        setPrestations(newPrestations);
    };

    // Valider et enregistrer toutes les modifications
    const handleValidate = async () => {
        if (!familleId) return;

        setLoading(true);
        try {
            for (const prestation of prestations) {
                if (prestation._id && prestation.designationacte) {
                    await fetch(`/api/actes/${prestation._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...prestation,
                            IDFAMILLE_ACTE_BIOLOGIE: familleId,
                        })
                    });
                }
            }
            alert("Enregistrement effectué avec succès");
        } catch (err) {
            console.error("Erreur lors de l'enregistrement", err);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    if (!familleId) {
        return (
            <div className="text-center text-muted p-4">
                Sélectionnez une famille d'actes pour voir les prestations associées
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Actes de la famille</h5>
                <div>
                    <Button variant="primary" size="sm" onClick={handleAddRow} className="me-2">
                        + Ajouter un acte
                    </Button>
                    <Button variant="success" size="sm" onClick={handleValidate} disabled={loading}>
                        {loading ? "Enregistrement..." : "Valider"}
                    </Button>
                </div>
            </div>

            <Table bordered hover responsive size="sm">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: "30%" }}>Acte</th>
                        <th style={{ width: "15%" }}>Lettre Clé</th>
                        <th style={{ width: "15%" }}>Coefficient</th>
                        <th style={{ width: "15%" }}>Ordre affichage</th>
                        <th style={{ width: "25%" }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {prestations.length > 0 ? (
                        prestations.map((prestation, index) => (
                            <tr key={index}>
                                <td>
                                    <Form.Select
                                        size="sm"
                                        value={prestation.designationacte}
                                        onChange={(e) => handleActeSelect(e.target.value, index)}
                                    >
                                        <option value="">-- Sélectionner un acte --</option>
                                        {actesDisponibles.map((acte) => (
                                            <option key={acte._id} value={acte.designationacte}>
                                                {acte.designationacte}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </td>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        value={prestation.lettreCle}
                                        readOnly
                                    />
                                </td>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={prestation.coefficient}
                                        readOnly
                                    />
                                </td>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={prestation.ORdonnacementAffichage || index + 1}
                                        readOnly
                                    />
                                </td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                        >
                                            <FaArrowUp />
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === prestations.length - 1}
                                        >
                                            <FaArrowDown />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(index)}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="text-center text-muted">
                                Aucun acte associé. Cliquez sur "Ajouter un acte" pour commencer.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}
