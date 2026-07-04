"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
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

interface ActeSelectProps {
    actes: ActePrestation[];
    selectedId: string;
    onSelect: (acte: ActePrestation) => void;
}

const ActeSelect = memo(function ActeSelect({ actes, selectedId, onSelect }: ActeSelectProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const filteredActes = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        const list = searchTerm
            ? actes.filter(
                (a) =>
                    a.designationacte?.toLowerCase().includes(lower) ||
                    a.lettreCle?.toLowerCase().includes(lower)
            )
            : actes;
        return list.slice(0, 50);
    }, [searchTerm, actes]);

    useEffect(() => {
        if (showDropdown && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 5,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [showDropdown]);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node) &&
            inputRef.current &&
            !inputRef.current.contains(event.target as Node)
        ) {
            setShowDropdown(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    const handleSelect = useCallback(
        (acte: ActePrestation) => {
            onSelect(acte);
            setSearchTerm("");
            setShowDropdown(false);
        },
        [onSelect]
    );

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
    }, []);

    const selectedActe = useMemo(
        () => actes.find((a) => a._id === selectedId),
        [actes, selectedId]
    );

    return (
        <div style={{ position: "relative" }}>
            <Form.Control
                ref={inputRef}
                type="text"
                size="sm"
                placeholder="Rechercher un acte..."
                value={searchTerm || selectedActe?.designationacte || ""}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: "fixed",
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                        maxHeight: "200px",
                        overflow: "auto",
                        backgroundColor: "white",
                        border: "1px solid #dee2e6",
                        borderRadius: "0.375rem",
                        boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                        zIndex: 1050,
                    }}
                >
                    {filteredActes.length === 0 ? (
                        <div style={{ padding: "8px", color: "#6c757d", fontSize: "13px" }}>
                            Aucun acte trouvé
                        </div>
                    ) : (
                        filteredActes.map((acte) => (
                            <div
                                key={acte._id}
                                onClick={() => handleSelect(acte)}
                                style={{
                                    padding: "8px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    borderBottom: "1px solid #f8f9fa",
                                    backgroundColor: acte._id === selectedId ? "#e3f2fd" : "white",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        acte._id === selectedId ? "#e3f2fd" : "white";
                                }}
                            >
                                <div>
                                    <strong>{acte.designationacte}</strong>
                                </div>
                                {acte.lettreCle && (
                                    <div style={{ fontSize: "11px", color: "#6c757d" }}>
                                        {acte.lettreCle}
                                        {acte.coefficient ? ` · Coef. ${acte.coefficient}` : ""}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
});

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

    const handleActeSelect = (acte: ActePrestation, index: number) => {
        if (!acte || !familleId) return;

        const newPrestations = [...prestations];
        newPrestations[index] = {
            ...acte,
            IDFAMILLE_ACTE_BIOLOGIE: familleId,
            ORdonnacementAffichage: index + 1,
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
        if (!acte._id) {
            // Ligne non encore liée à un acte réel : suppression locale uniquement
            const newPrestations = prestations.filter((_, i) => i !== index);
            newPrestations.forEach((p, i) => p.ORdonnacementAffichage = i + 1);
            setPrestations(newPrestations);
            return;
        }

        try {
            const { _id, ...acteData } = acte as any;
            const res = await fetch(`/api/actes/${_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...acteData,
                    IDFAMILLE_ACTE_BIOLOGIE: "",
                    ORdonnacementAffichage: 0
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Erreur lors du retrait de l'acte");
            }

            const newPrestations = prestations.filter((_, i) => i !== index);
            newPrestations.forEach((p, i) => p.ORdonnacementAffichage = i + 1);
            setPrestations(newPrestations);
            alert("Acte retiré avec succès");
        } catch (err: any) {
            console.error("Erreur lors de la suppression", err);
            alert(err.message || "Erreur lors du retrait de l'acte");
        }
    };

    // Valider et enregistrer toutes les modifications
    const handleValidate = async () => {
        if (!familleId) return;

        setLoading(true);
        try {
            for (let i = 0; i < prestations.length; i++) {
                const prestation = prestations[i];
                if (prestation._id && prestation.designationacte) {
                    const { _id, ...data } = prestation as any;
                    await fetch(`/api/actes/${_id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...data,
                            IDFAMILLE_ACTE_BIOLOGIE: familleId,
                            ORdonnacementAffichage: i + 1,
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
                                    <ActeSelect
                                        actes={actesDisponibles}
                                        selectedId={prestation._id}
                                        onSelect={(acte) => handleActeSelect(acte, index)}
                                    />
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
