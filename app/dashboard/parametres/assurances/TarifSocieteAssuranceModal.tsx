"use client";

import React, { useEffect, useState } from "react";
import { Modal, Table, Button, Spinner, Form } from "react-bootstrap";
import { FaSync } from "react-icons/fa";

type SocieteAssurance = {
    _id: string;
    societe: string;
};

type TarifSocieteAssurance = {
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
    societe: SocieteAssurance | null;
    assuranceId?: string;
};

export default function TarifSocieteAssuranceModal({ show, onHide, societe, assuranceId }: Props) {
    const [loading, setLoading] = useState(false);
    const [tarifs, setTarifs] = useState<TarifSocieteAssurance[]>([]);
    const [initialTarifs, setInitialTarifs] = useState<TarifSocieteAssurance[]>([]);
    const [saving, setSaving] = useState(false);
    const [adjustment, setAdjustment] = useState<number>(0);
    const [lettreCleSel, setLettreCleSel] = useState("B");
    const [prixMutuel, setPrixMutuel] = useState<number | "">("");
    const [prixPref, setPrixPref] = useState<number | "">("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        if (!societe || !show) return;

        const fetchTarifs = async () => {
            setLoading(true);
            try {
                // S'assurer que l'assurance a tous ses tarifs avant de copier
                if (assuranceId) {
                    await fetch(`/api/tarifs/${assuranceId}`).catch(() => {});
                }

                const res = await fetch(`/api/tarifs-societe-assurance?societeAssuranceId=${societe._id}`);
                if (!res.ok) throw new Error("Impossible de charger les tarifs");
                const data = await res.json();
                const tarifsArray = Array.isArray(data) ? data : [];
                setTarifs(tarifsArray);
                setInitialTarifs(tarifsArray.map((t: TarifSocieteAssurance) => ({ ...t })));
            } catch (err) {
                console.error("Erreur chargement tarifs société:", err);
                alert("Erreur lors du chargement des tarifs");
            } finally {
                setLoading(false);
            }
        };

        fetchTarifs();
    }, [societe, show, assuranceId]);

    const handleChange = (id: string, field: keyof TarifSocieteAssurance, value: string) => {
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

    const handleActualiserPrix = () => {
        if (prixMutuel === "" && prixPref === "") {
            alert("Veuillez saisir au moins un prix à actualiser");
            return;
        }
        const cible = tarifs.filter(t => t.lettreCle === lettreCleSel);
        if (cible.length === 0) {
            alert(`Aucun tarif avec la lettre clé ${lettreCleSel}`);
            return;
        }
        if (!confirm(`Appliquer les prix saisis aux ${cible.length} acte(s) de lettre clé ${lettreCleSel} ?`)) return;

        setActionLoading("actualiser");
        setTarifs(prev =>
            prev.map(t =>
                t.lettreCle === lettreCleSel
                    ? {
                        ...t,
                        prixmutuel: prixMutuel !== "" ? Math.round(prixMutuel) : t.prixmutuel,
                        prixpreferenciel: prixPref !== "" ? Math.round(prixPref) : t.prixpreferenciel,
                    }
                    : t
            )
        );
        setActionLoading(null);
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
        if (!societe) return;
        setSaving(true);
        try {
            const res = await fetch("/api/tarifs-societe-assurance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tarifs),
            });
            if (!res.ok) throw new Error("Erreur de sauvegarde");
            alert("Tarifs société enregistrés avec succès ✅");
            setInitialTarifs(tarifs.map(t => ({ ...t })));
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement ❌");
        } finally {
            setSaving(false);
        }
    };

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
        <Modal show={show} onHide={handleHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-info text-white">
                <Modal.Title>Tarifs de la société – {societe?.societe}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center p-3">
                        <Spinner animation="border" variant="info" />
                    </div>
                ) : (
                    <>
                        <Form.Control
                            className="mb-3"
                            placeholder="Filtrer par le nom de l'acte..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />

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

                        {/* ✅ Actualisation par lettre clé */}
                        <Form className="row g-2 mb-4">
                            <div className="col-12 col-md-2">
                                <Form.Select value={lettreCleSel} onChange={e => setLettreCleSel(e.target.value)}>
                                    {["B", "D", "K", "KC", "Z"].map(l => <option key={l} value={l}>{l}</option>)}
                                </Form.Select>
                            </div>
                            <div className="col-12 col-sm-4 col-md-2">
                                <Form.Control type="number" placeholder="Prix Mutuel" value={prixMutuel} onChange={e => setPrixMutuel(e.target.value ? parseFloat(e.target.value) : "")} />
                            </div>
                            <div className="col-12 col-sm-4 col-md-2">
                                <Form.Control type="number" placeholder="Prix Préférentiel" value={prixPref} onChange={e => setPrixPref(e.target.value ? parseFloat(e.target.value) : "")} />
                            </div>
                            <div className="col-12 col-md-auto">
                                <Button variant="primary" className="w-100 d-flex align-items-center justify-content-center gap-1" onClick={handleActualiserPrix} disabled={actionLoading === "actualiser"}>
                                    {actionLoading === "actualiser" && <Spinner as="span" animation="border" size="sm" className="me-2" />}
                                    <FaSync /> Actualiser
                                </Button>
                            </div>
                        </Form>

                        <Table bordered hover responsive size="sm">
                            <thead className="table-info">
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
                                                    size="sm"
                                                    value={t.coefficient}
                                                    onChange={e => handleChange(t._id, "coefficient", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={t.prixmutuel}
                                                    onChange={e => handleChange(t._id, "prixmutuel", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={t.prixpreferenciel}
                                                    onChange={e => handleChange(t._id, "prixpreferenciel", e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>

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
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
                <Button variant="success" onClick={handleSave} disabled={saving || tarifs.length === 0}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
