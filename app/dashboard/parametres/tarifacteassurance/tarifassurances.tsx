"use client";

import React, { useEffect, useState } from "react";
import { Modal, Table, Button, Spinner, Form } from "react-bootstrap";
import { Assurance } from "@/types/assurance";

type TarifAssurance = {
    _id: string;
    acteId: string;
    acte: string;
    lettreCle: string;
    coefficient: number;
    prixmutuel: number;
    prixpreferenciel: number;
};

type Props = {
    show: boolean;
    onHide: () => void;
    assurance: Assurance | null;
};

export default function TarifAssuranceModal({ show, onHide, assurance }: Props) {
    const [loading, setLoading] = useState(false);
    const [tarifs, setTarifs] = useState<TarifAssurance[]>([]);
    const [initialTarifs, setInitialTarifs] = useState<TarifAssurance[]>([]);
    const [saving, setSaving] = useState(false);
    const [adjustment, setAdjustment] = useState<number>(0);




    useEffect(() => {
        if (!assurance || !show) return;

        const fetchTarifs = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/tarifs/${assurance._id}`);
                if (!res.ok) throw new Error("Impossible de charger les tarifs");
                const data = await res.json();
                const tarifsArray = Array.isArray(data) ? data : [];
                setTarifs(tarifsArray);
                setInitialTarifs(tarifsArray.map((t: TarifAssurance) => ({ ...t })));
            } catch (err) {
                console.error("Erreur chargement tarifs:", err);
                alert("Erreur lors du chargement des tarifs");
            } finally {
                setLoading(false);
            }
        };

        fetchTarifs();
    }, [assurance, show]);

    const handleChange = (id: string, field: keyof TarifAssurance, value: string) => {
        const val = Number(value);
        setTarifs(prev =>
            prev.map(t =>
                t._id === id
                    ? {
                        ...t,
                        [field]:
                            field === "prixmutuel" || field === "prixpreferenciel"
                                ? Math.round(val)
                                : val,
                    }
                    : t
            )
        );
    };

    const handleApplyPercentage = () => {
        if (!adjustment) return;
        if (!confirm(`Voulez-vous vraiment appliquer ${adjustment}% à tous les tarifs supérieurs à 0 ?`)) return;

        setTarifs(prev =>
            prev.map(t => ({
                ...t,
                prixmutuel:
                    t.prixmutuel > 0
                        ? Math.round(t.prixmutuel * (1 + adjustment / 100))
                        : t.prixmutuel,
                prixpreferenciel:
                    t.prixpreferenciel > 0
                        ? Math.round(t.prixpreferenciel * (1 + adjustment / 100))
                        : t.prixpreferenciel,
            }))
        );
    };

    const handleRestore = () => {
        if (!confirm("Voulez-vous vraiment restaurer tous les tarifs à leur valeur initiale ?")) return;
        setTarifs(
            initialTarifs.map(t => ({
                ...t,
                prixmutuel: Math.round(t.prixmutuel),
                prixpreferenciel: Math.round(t.prixpreferenciel),
            }))
        );
    };

    const handleSave = async () => {
        if (!assurance) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/tarifs/${assurance._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tarifs),
            });
            if (!res.ok) throw new Error("Erreur de sauvegarde");
            alert("Tarifs enregistrés avec succès ✅");
            setInitialTarifs(tarifs.map(t => ({ ...t })));
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement ❌");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveDuplicates = async () => {
        if (!assurance) return;
        if (!confirm("Voulez-vous vraiment supprimer les doublons de tarifs pour cette assurance ?")) return;

        try {
            const res = await fetch("/api/tarifassurance/remove-duplicates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assuranceId: assurance._id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur");

            alert(data.message || "Doublons supprimés ✅");

            // Recharger les tarifs
            const reloadRes = await fetch(`/api/tarifs/${assurance._id}`);
            const reloadData = await reloadRes.json();
            setTarifs(reloadData);
            setInitialTarifs(reloadData.map((t: TarifAssurance) => ({ ...t })));
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erreur lors de la suppression des doublons ❌");
        }
    };

    // ✅ Filtrage + Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);


    const filteredTarifs = tarifs
        .filter(
            t =>
                t.acte.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.lettreCle.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.acte.localeCompare(b.acte));

    const totalPages = Math.ceil(filteredTarifs.length / itemsPerPage);
    const paginatedTarifs = filteredTarifs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    // Réinitialise le filtre à la fermeture du modal
    const handleHide = () => {
        setSearchTerm("");
        setCurrentPage(1);
        onHide();
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <Modal show={show} onHide={handleHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Tarif Assurance – {assurance?.designationassurance}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center p-3">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <>
                        {/* ✅ Filtre */}
                        <Form.Control
                            className="mb-3"
                            placeholder="Filtrer par le nom de l'acte..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        {/* ✅ Choix d'affichage par page */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Form.Group className="d-flex align-items-center mb-0">
                                <Form.Label className="me-2 mb-0">Afficher</Form.Label>
                                <Form.Select
                                    size="sm"
                                    style={{ width: 80 }}
                                    value={itemsPerPage}
                                    onChange={e => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={75}>75</option>
                                    <option value={100}>100</option>
                                </Form.Select>
                                <span className="ms-2">par page</span>
                            </Form.Group>

                            {/* ✅ Ajustement global*/}
                            <Form.Group className="d-flex align-items-center">
                                <Form.Label className="me-2 mb-0">% Ajustement</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={adjustment}
                                    onChange={e => setAdjustment(Number(e.target.value))}
                                    style={{ width: 100 }}
                                />
                                <Button className="ms-2" variant="info" onClick={handleApplyPercentage}>
                                    Appliquer
                                </Button>
                                <Button className="ms-2" variant="warning" onClick={handleRestore}>
                                    Restaurer
                                </Button>
                            </Form.Group>
                        </div>

                        {/* ✅ Table des tarifs */}

                        <Table bordered hover responsive>
                            <thead className="table-success">
                                <tr>
                                    <th>#</th>
                                    <th>Acte</th>
                                    <th>Lettre Clé</th>
                                    <th>Coefficient</th>
                                    <th>Prix Mutuel</th>
                                    <th>Prix Préférentiel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTarifs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center">
                                            Aucun tarif disponible.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTarifs.map((t, i) => (
                                        <tr key={t._id}>
                                            <td>{i + 1 + (currentPage - 1) * itemsPerPage}</td>
                                            <td>{t.acte}</td>
                                            <td>{t.lettreCle}</td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={t.coefficient}
                                                    onChange={e => handleChange(t._id, "coefficient", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={t.prixmutuel}
                                                    onChange={e => handleChange(t._id, "prixmutuel", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={t.prixpreferenciel}
                                                    onChange={e => handleChange(t._id, "prixpreferenciel", e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>

                        {/* Pagination moderne */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                                <Button size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                    Précédent
                                </Button>
                                <span>
                                    Page {currentPage} / {totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Suivant
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={handleRemoveDuplicates} className="me-auto">
                    Supprimer les doublons
                </Button>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || tarifs.length === 0}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
