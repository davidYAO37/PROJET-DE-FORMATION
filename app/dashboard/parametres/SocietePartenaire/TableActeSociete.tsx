"use client";

import { useState, useEffect } from "react";
import { Table, Button, Form } from "react-bootstrap";
import { FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { ActeSocietePartenaire } from "@/types/ActeSocietePartenaire";

interface ActeCliniqueOption {
    _id: string;
    designationacte: string;
    lettreCle: string;
    coefficient: number;
    prixClinique: number;
    IDFAMILLE_ACTE_BIOLOGIE?: string;
}

interface FamilleActeOption {
    _id: string;
    Description: string;
}

interface Props {
    societeId: string | null;
}

const emptyLigne = (societeId: string, ordre: number): ActeSocietePartenaire => ({
    IDSOCIETEPARTENAIRE: societeId,
    IDACTEP: "",
    LettreCle: "",
    CoefficientActe: 0,
    PrixTotal: 0,
    IDFAMILLE_ACTE_BIOLOGIE: "",
    OrdonnacementAffichage: ordre,
});

export default function TableActeSociete({ societeId }: Props) {
    const [acteSocietePartenaire, setActeSocietePartenaire] = useState<ActeSocietePartenaire[]>([]);
    const [actesDisponibles, setActesDisponibles] = useState<ActeCliniqueOption[]>([]);
    const [famillesActe, setFamillesActe] = useState<FamilleActeOption[]>([]);
    const [loading, setLoading] = useState(false);





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

    // Charger les familles d'actes
    useEffect(() => {
        const fetchFamillesActe = async () => {
            try {
                const res = await fetch("/api/familleacte");
                if (res.ok) {
                    const data = await res.json();
                    setFamillesActe(data);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des familles d'actes", err);
            }
        };
        fetchFamillesActe();
    }, []);

    const handleFamilleChange = (id: string, index: number) => {
        const newActeSocietePartenaire = [...acteSocietePartenaire];
        newActeSocietePartenaire[index].IDFAMILLE_ACTE_BIOLOGIE = id;
        setActeSocietePartenaire(newActeSocietePartenaire);
    };

    const loadActesSociete = async (id: string) => {
        try {
            const res = await fetch(`/api/ActeSocietePartenaire?societeId=${encodeURIComponent(id)}`);
            if (res.ok) {
                const data = await res.json();
                const sorted = (Array.isArray(data) ? data : [])
                    .map((a: ActeSocietePartenaire) => ({
                        ...a,
                        _id: a._id ? String(a._id) : undefined,
                        IDSOCIETEPARTENAIRE: a.IDSOCIETEPARTENAIRE ? String(a.IDSOCIETEPARTENAIRE) : undefined,
                        IDACTEP: a.IDACTEP ? String(a.IDACTEP) : undefined,
                        IDFAMILLE_ACTE_BIOLOGIE: a.IDFAMILLE_ACTE_BIOLOGIE ? String(a.IDFAMILLE_ACTE_BIOLOGIE) : undefined,
                    }))
                    .sort((a, b) => (a.OrdonnacementAffichage || 0) - (b.OrdonnacementAffichage || 0));
                setActeSocietePartenaire(sorted);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des actes société partenaire", err);
        }
    };

    useEffect(() => {
        if (!societeId) {
            setActeSocietePartenaire([]);
            return;
        }
        loadActesSociete(societeId);
    }, [societeId]);

    const getActeLabel = (idActe?: string) => {
        if (!idActe) return "";
        return actesDisponibles.find((a) => a._id === idActe)?.designationacte || "";
    };

    const handleActeSelect = (IDACTEP: string, index: number) => {
        if (!IDACTEP || !societeId) return;

        const acte = actesDisponibles.find((a) => a._id === IDACTEP);
        if (!acte) return;

        const newActeSocietePartenaire = [...acteSocietePartenaire];
        newActeSocietePartenaire[index] = {
            ...newActeSocietePartenaire[index],
            IDSOCIETEPARTENAIRE: societeId,
            IDACTEP: acte._id,
            LettreCle: acte.lettreCle,
            CoefficientActe: acte.coefficient,
            Prix: acte.prixClinique,
            PrixTotal: acte.prixClinique * acte.coefficient,
            IDFAMILLE_ACTE_BIOLOGIE: acte.IDFAMILLE_ACTE_BIOLOGIE,
            OrdonnacementAffichage: index + 1,
        };
        setActeSocietePartenaire(newActeSocietePartenaire);
    };

    const handleAddRow = () => {
        if (!societeId) return;
        setActeSocietePartenaire([
            ...acteSocietePartenaire,
            emptyLigne(societeId, acteSocietePartenaire.length + 1),
        ]);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newActeSocietePartenaire = [...acteSocietePartenaire];
        [newActeSocietePartenaire[index - 1], newActeSocietePartenaire[index]] =
            [newActeSocietePartenaire[index], newActeSocietePartenaire[index - 1]];
        newActeSocietePartenaire.forEach((p, i) => { p.OrdonnacementAffichage = i + 1; });
        setActeSocietePartenaire(newActeSocietePartenaire);
    };

    const handleMoveDown = (index: number) => {
        if (index === acteSocietePartenaire.length - 1) return;
        const newActeSocietePartenaire = [...acteSocietePartenaire];
        [newActeSocietePartenaire[index], newActeSocietePartenaire[index + 1]] =
            [newActeSocietePartenaire[index + 1], newActeSocietePartenaire[index]];
        newActeSocietePartenaire.forEach((p, i) => { p.OrdonnacementAffichage = i + 1; });
        setActeSocietePartenaire(newActeSocietePartenaire);
    };

    const handleDelete = async (index: number) => {
        if (!window.confirm("Voulez-vous retirer cet acte ?")) return;

        const acte = acteSocietePartenaire[index];
        if (acte._id) {
            try {
                const res = await fetch(`/api/ActeSocietePartenaire/${acte._id}`, { method: "DELETE" });
                if (!res.ok) {
                    alert("Erreur lors de la suppression");
                    return;
                }
                alert("Acte retiré avec succès");
            } catch (err) {
                console.error("Erreur lors de la suppression", err);
                return;
            }
        }

        const newActeSocietePartenaire = acteSocietePartenaire.filter((_, i) => i !== index);
        newActeSocietePartenaire.forEach((p, i) => { p.OrdonnacementAffichage = i + 1; });
        setActeSocietePartenaire(newActeSocietePartenaire);
    };

    const handleValidate = async () => {
        if (!societeId) return;

        setLoading(true);
        try {
            for (const acte of acteSocietePartenaire) {
                if (!acte.IDACTEP) continue;

                const payload = {
                    IDSOCIETEPARTENAIRE: societeId,
                    IDACTEP: acte.IDACTEP,
                    LettreCle: acte.LettreCle,
                    Prix: acte.Prix,
                    CoefficientActe: acte.CoefficientActe,
                    PrixTotal: acte.PrixTotal,
                    IDFAMILLE_ACTE_BIOLOGIE: acte.IDFAMILLE_ACTE_BIOLOGIE,
                    OrdonnacementAffichage: acte.OrdonnacementAffichage,
                };

                if (acte._id) {
                    await fetch(`/api/ActeSocietePartenaire/${acte._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                } else {
                    await fetch("/api/ActeSocietePartenaire", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                }
            }
            await loadActesSociete(societeId);
            alert("Enregistrement effectué avec succès");
        } catch (err) {
            console.error("Erreur lors de l'enregistrement", err);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    if (!societeId) {
        return (
            <div className="text-center text-muted p-4">
                Sélectionnez une société partenaire pour voir les actes associés
            </div>
        );
    }

    const handlePrixChange = (prix: string, index: number) => {
        const newActeSocietePartenaire = [...acteSocietePartenaire];

        const ligne = newActeSocietePartenaire[index];
        if (!ligne) return;

        ligne.Prix = parseFloat(prix) || 0;
        ligne.PrixTotal = (ligne.Prix || 0) * (ligne.CoefficientActe || 0);

        setActeSocietePartenaire(newActeSocietePartenaire);
    };

    const handleCoefficientChange = (coefficient: string, index: number) => {
        const newActeSocietePartenaire = [...acteSocietePartenaire];

        const ligne = newActeSocietePartenaire[index];
        if (!ligne) return;

        ligne.CoefficientActe = parseFloat(coefficient) || 0;
        ligne.PrixTotal = (ligne.Prix || 0) * (ligne.CoefficientActe || 0);

        setActeSocietePartenaire(newActeSocietePartenaire);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Actes de la société partenaire</h5>
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
                        <th style={{ width: "40%" }}>Acte</th>
                        <th style={{ width: "10%" }}>Lettre Clé</th>
                        <th style={{ width: "8%" }}>Coef</th>
                        <th style={{ width: "12%" }}>Prix U</th>
                        <th style={{ width: "14%" }}>Prix Total</th>
                        <th style={{ width: "20%" }}>Famille</th>
                        <th style={{ width: "5%" }}>Ordre affi</th>
                        <th style={{ width: "25%" }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {acteSocietePartenaire.length > 0 ? (
                        acteSocietePartenaire.map((acte, index) => (
                            <tr key={acte._id || `row-${index}`}>
                                <td>
                                    <Form.Select
                                        size="sm"
                                        value={acte.IDACTEP || ""}
                                        onChange={(e) => handleActeSelect(e.target.value, index)}
                                    >
                                        <option value="">-- Sélectionner un acte --</option>
                                        {actesDisponibles.map((option) => (
                                            <option key={option._id} value={option._id}>
                                                {option.designationacte}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    {acte.IDACTEP && !getActeLabel(acte.IDACTEP) && (
                                        <small className="text-muted">Acte ID: {acte.IDACTEP}</small>
                                    )}
                                </td>
                                <td>
                                    <Form.Control size="sm" type="text" value={acte.LettreCle || ""} readOnly />
                                </td>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={acte.CoefficientActe || 0}
                                        onChange={(e) => handleCoefficientChange(e.target.value, index)}
                                    />
                                </td>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={acte.Prix || 0}
                                        onChange={(e) => handlePrixChange(e.target.value, index)}
                                    />
                                </td>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={acte.PrixTotal || 0}
                                        readOnly
                                    />
                                </td>
                                <td>
                                    <Form.Select
                                        size="sm"
                                        value={acte.IDFAMILLE_ACTE_BIOLOGIE || ""}
                                        onChange={(e) =>
                                            handleFamilleChange(
                                                e.target.value,
                                                index
                                            )
                                        }
                                    >
                                        <option value="">
                                            -- Sélectionner --
                                        </option>

                                        {famillesActe.map((famille) => (
                                            <option
                                                key={famille._id}
                                                value={famille._id}
                                            >
                                                {famille.Description}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </td>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={acte.OrdonnacementAffichage || index + 1}
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
                                            disabled={index === acteSocietePartenaire.length - 1}
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
                            <td colSpan={8} className="text-center text-muted">
                                Aucun acte associé. Cliquez sur &quot;Ajouter un acte&quot; pour commencer.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}
