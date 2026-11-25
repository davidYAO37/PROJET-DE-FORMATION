"use client";
import { useEffect, useState } from "react";
import { Card, Form, Table, Button, Badge, Spinner } from "react-bootstrap";
import { matchesSearch } from "@/lib/searchText";

export interface ActeSupplementaireInput {
    idActe: string;
    designation: string;
    qte: number;
    prixClinique: number;
    montantAssurance: number;
}

type Acte = {
    _id: string;
    designationacte: string;
    prixClinique?: number;
    acteAdditionnel?: boolean;
    montantAdditionnel?: number;
};

type BlocActesSupplementairesProps = {
    actePrincipalId: string;
    onChange: (lignes: ActeSupplementaireInput[]) => void;
};

export default function BlocActesSupplementaires({
    actePrincipalId,
    onChange,
}: BlocActesSupplementairesProps) {
    const [enabled, setEnabled] = useState(false);
    const [actes, setActes] = useState<Acte[]>([]);
    const [loadingActes, setLoadingActes] = useState(false);
    const [search, setSearch] = useState("");
    const [lignes, setLignes] = useState<ActeSupplementaireInput[]>([]);

    // Charger les actes additionnels la première fois que la case est cochée
    useEffect(() => {
        if (!enabled || actes.length > 0) return;
        setLoadingActes(true);
        fetch("/api/actes")
            .then((res) => res.json())
            .then((data) =>
                setActes(Array.isArray(data) ? data.filter((a: Acte) => a.acteAdditionnel) : [])
            )
            .catch(() => setActes([]))
            .finally(() => setLoadingActes(false));
    }, [enabled, actes.length]);

    // Ne jamais facturer deux fois l'acte principal
    useEffect(() => {
        if (!actePrincipalId) return;
        setLignes((prev) => prev.filter((l) => l.idActe !== actePrincipalId));
    }, [actePrincipalId]);

    // Remonter les lignes au parent
    useEffect(() => {
        onChange(enabled ? lignes : []);
    }, [enabled, lignes]);

    const montantPour = (acte: Acte): number =>
        Math.round(acte.montantAdditionnel ?? acte.prixClinique ?? 0);

    const toggleActe = (acte: Acte) => {
        setLignes((prev) => {
            const exists = prev.some((l) => l.idActe === acte._id);
            if (exists) return prev.filter((l) => l.idActe !== acte._id);
            return [
                ...prev,
                {
                    idActe: acte._id,
                    designation: acte.designationacte,
                    qte: 1,
                    // Montant intégralement à la charge du patient (pas de part assurance)
                    prixClinique: montantPour(acte),
                    montantAssurance: 0,
                },
            ];
        });
    };

    const updateLigne = (idActe: string, field: "qte" | "prixClinique", value: number) => {
        setLignes((prev) =>
            prev.map((l) => (l.idActe === idActe ? { ...l, [field]: Math.max(0, Math.round(value || 0)) } : l))
        );
    };

    const filteredActes = actes
        .filter((a) => a._id !== actePrincipalId)
        .filter((a) => (search ? matchesSearch(search, a.designationacte) : true));

    return (
        <Card className="p-2 mb-2">
            <Form.Check
                type="checkbox"
                id="chk-actes-supp"
                label="Ajouter d'autres actes à la consultation"
                checked={enabled}
                onChange={(e) => {
                    setEnabled(e.target.checked);
                    if (!e.target.checked) setLignes([]);
                }}
                className="fw-semibold"
            />

            {enabled && (
                <div className="mt-2">
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Rechercher un acte..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-2"
                    />
                    {loadingActes ? (
                        <div className="text-muted small py-2">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Chargement des actes...
                        </div>
                    ) : (
                        <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #dee2e6", borderRadius: 6, padding: 8 }}>
                            {filteredActes.length === 0 ? (
                                <div className="text-muted small">
                                    Aucun acte additionnel trouvé. Cochez « Acte additionnel en consultation » dans le paramétrage de l'acte pour qu'il apparaisse ici.
                                </div>
                            ) : (
                                filteredActes.map((a) => (
                                    <Form.Check
                                        key={a._id}
                                        type="checkbox"
                                        id={`acte-supp-${a._id}`}
                                        label={`${a.designationacte} — ${montantPour(a).toLocaleString()} FCFA`}
                                        checked={lignes.some((l) => l.idActe === a._id)}
                                        onChange={() => toggleActe(a)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {lignes.length > 0 && (
                        <Table bordered size="sm" className="mt-2 mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Acte</th>
                                    <th style={{ width: 70 }}>Qté</th>
                                    <th style={{ width: 150 }}>Montant (part patient)</th>
                                    <th style={{ width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lignes.map((l) => (
                                    <tr key={l.idActe}>
                                        <td className="align-middle">{l.designation}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                min={1}
                                                value={l.qte}
                                                onChange={(e) => updateLigne(l.idActe, "qte", Math.max(1, Number(e.target.value) || 1))}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                value={l.prixClinique}
                                                onChange={(e) => updateLigne(l.idActe, "prixClinique", Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="text-center align-middle">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => setLignes((prev) => prev.filter((x) => x.idActe !== l.idActe))}
                                            >
                                                ×
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {lignes.length > 0 && (
                        <div className="mt-1">
                            <Badge bg="secondary">{lignes.length} acte(s) additionnel(s)</Badge>
                            <span className="text-muted small ms-2">Montants intégralement à la charge du patient</span>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
