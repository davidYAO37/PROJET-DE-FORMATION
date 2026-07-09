"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Table, Badge, Spinner, Button, Form, Modal, Row, Col, Alert,
} from "react-bootstrap";
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSync } from "react-icons/fa";
import { usePagination } from "@/components/usePagination";
import Pagination from "@/components/Pagination";
import PharmacieModalPharmAccueil from "../PharmacieAccueil/PharmacieModalPharmAccueil";

interface StockItem {
    _id: string;
    Reference?: string;
    Medicament?: string;
    QteEnStock?: number;
    QteStockVirtuel?: number;
    QteMinimum?: number;
    QteMaximum?: number;
    AuteurModif?: string;
    DateModif?: string;
}

interface ModalSeuil {
    show: boolean;
    item: StockItem | null;
}

export default function GestionStockMedicaments() {
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof StockItem; direction: "asc" | "desc" } | null>(null);
    const [modalSeuil, setModalSeuil] = useState<ModalSeuil>({ show: false, item: null });
    const [qteMin, setQteMin] = useState(0);
    const [qteMax, setQteMax] = useState(0);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [erreurMsg, setErreurMsg] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("TOUS");
    const [pageSize, setPageSize] = useState(15);
    const [showPharmacieModalPharmAccueil, setShowPharmacieModalPharmAccueil] = useState(false);

    const chargerStocks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/stock");
            const data = await res.json();
            setStocks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erreur chargement stocks:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        chargerStocks();
    }, [chargerStocks]);

    const ouvrirModalSeuil = (item: StockItem) => {
        setQteMin(item.QteMinimum ?? 0);
        setQteMax(item.QteMaximum ?? 0);
        setModalSeuil({ show: true, item });
        setSuccessMsg("");
        setErreurMsg("");
    };

    const sauvegarderSeuils = async () => {
        if (!modalSeuil.item) return;
        setSaving(true);
        setErreurMsg("");
        try {
            const res = await fetch(`/api/stock/${modalSeuil.item._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    QteMinimum: qteMin,
                    QteMaximum: qteMax,
                    AuteurModif: "Pharmacien",
                }),
            });
            if (!res.ok) throw new Error("Erreur lors de la mise à jour");
            setStocks(prev =>
                prev.map(s =>
                    s._id === modalSeuil.item!._id
                        ? { ...s, QteMinimum: qteMin, QteMaximum: qteMax }
                        : s
                )
            );
            setSuccessMsg("Seuils mis à jour avec succès ✅");
            setTimeout(() => {
                setModalSeuil({ show: false, item: null });
                setSuccessMsg("");
            }, 1500);
        } catch (err: any) {
            setErreurMsg(err.message || "Erreur inconnue");
        } finally {
            setSaving(false);
        }
    };

    /* ===== TRI ===== */
    const handleSort = (key: keyof StockItem) => {
        setSortConfig(prev =>
            prev && prev.key === key
                ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { key, direction: "asc" }
        );
    };

    const renderSortIcon = (key: keyof StockItem) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    };

    /* ===== FILTRE + TRI ===== */
    const filtered = useMemo(() => {
        let list = stocks.filter(s => {
            const txt = (s.Medicament || "").toLowerCase().includes(search.toLowerCase()) ||
                        (s.Reference || "").toLowerCase().includes(search.toLowerCase());
            const qte = s.QteEnStock ?? 0;
            const min = s.QteMinimum ?? 0;
            const statut = qte <= 0 ? "RUPTURE" : (min > 0 && qte <= min) ? "CRITIQUE" : "OK";
            return txt && (filtreStatut === "TOUS" || statut === filtreStatut);
        });
        if (sortConfig) {
            list = [...list].sort((a, b) => {
                const vA = a[sortConfig.key] ?? "";
                const vB = b[sortConfig.key] ?? "";
                if (typeof vA === "number" && typeof vB === "number")
                    return sortConfig.direction === "asc" ? vA - vB : vB - vA;
                return sortConfig.direction === "asc"
                    ? String(vA).localeCompare(String(vB))
                    : String(vB).localeCompare(String(vA));
            });
        }
        return list;
    }, [stocks, search, filtreStatut, sortConfig]);

    const { slice, page, totalPages, setPage, reset } = usePagination(filtered, pageSize);

    const getStatutBadge = (item: StockItem) => {
        const qte = item.QteEnStock ?? 0;
        const min = item.QteMinimum ?? 0;
        if (qte <= 0) return <Badge bg="danger">RUPTURE</Badge>;
        if (min > 0 && qte <= min) return <Badge bg="warning" text="dark">CRITIQUE</Badge>;
        return <Badge bg="success">OK</Badge>;
    };

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
                <div className="d-flex gap-2 flex-wrap">
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Filtrer par médicament ou référence..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); reset(); }}
                        style={{ maxWidth: 280 }}
                    />
                    <Form.Select size="sm" style={{ maxWidth: 160 }} value={filtreStatut}
                        onChange={e => { setFiltreStatut(e.target.value); reset(); }}>
                        <option value="TOUS">Tous les statuts</option>
                        <option value="OK">OK</option>
                        <option value="CRITIQUE">Critique (sous seuil min)</option>
                        <option value="RUPTURE">Rupture</option>
                    </Form.Select>
                </div>
                 <Button
                            variant="outline-warning"
                            title="Ajouter une ordonnance"
                            size="sm"
                            onClick={() => setShowPharmacieModalPharmAccueil(true)}
                          >
                            Ajouter une ordonnance
                          </Button>
                          {/* Modal ajouter examens*hospit ... */}
                          <PharmacieModalPharmAccueil
                            show={showPharmacieModalPharmAccueil}
                            onHide={() => setShowPharmacieModalPharmAccueil(false)}
                          />
                <Button size="sm" variant="outline-secondary" onClick={chargerStocks}>
                    <FaSync /> Actualiser
                </Button>
            </div>

            <p className="text-muted small mb-2">
                {filtered.length} médicament(s) — Cliquez sur <FaEdit className="text-primary" /> pour définir les seuils de réapprovisionnement.
            </p>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover size="sm" className="text-center align-middle">
                        <thead className="table-primary">
                            <tr>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort("Reference")}>
                                    Référence {renderSortIcon("Reference")}
                                </th>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort("Medicament")}>
                                    Médicament {renderSortIcon("Medicament")}
                                </th>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort("QteEnStock")}>
                                    Stock physique {renderSortIcon("QteEnStock")}
                                </th>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort("QteStockVirtuel")}>
                                    Stock virtuel {renderSortIcon("QteStockVirtuel")}
                                </th>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort("QteMinimum")}>
                                    Seuil min {renderSortIcon("QteMinimum")}
                                </th>
                                <th style={{ cursor: "pointer" }} onClick={() => handleSort("QteMaximum")}>
                                    Seuil max {renderSortIcon("QteMaximum")}
                                </th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-muted py-4">
                                        Aucun médicament en stock.
                                    </td>
                                </tr>
                            ) : (
                                slice.map(item => (
                                    <tr key={item._id}>
                                        <td>{item.Reference || "—"}</td>
                                        <td className="text-start">{item.Medicament || "—"}</td>
                                        <td>
                                            <strong className={(item.QteEnStock ?? 0) <= 0 ? "text-danger" : ""}>
                                                {item.QteEnStock ?? 0}
                                            </strong>
                                        </td>
                                        <td>{item.QteStockVirtuel ?? 0}</td>
                                        <td>
                                            {(item.QteMinimum ?? 0) > 0
                                                ? item.QteMinimum
                                                : <span className="text-muted">Non défini</span>}
                                        </td>
                                        <td>
                                            {(item.QteMaximum ?? 0) > 0
                                                ? item.QteMaximum
                                                : <span className="text-muted">Non défini</span>}
                                        </td>
                                        <td>{getStatutBadge(item)}</td>
                                        <td>
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                title="Définir les seuils"
                                                onClick={() => ouvrirModalSeuil(item)}
                                            >
                                                <FaEdit />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={pageSize}
                        onPage={setPage} onPageSize={n => { setPageSize(n); reset(); }} />
                </div>
            )}

            {/* ===== MODAL SEUILS ===== */}
            <Modal show={modalSeuil.show} onHide={() => setModalSeuil({ show: false, item: null })} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6">Seuils — {modalSeuil.item?.Medicament}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {successMsg && <Alert variant="success" className="py-2">{successMsg}</Alert>}
                    {erreurMsg && <Alert variant="danger" className="py-2">{erreurMsg}</Alert>}
                    <Row className="g-3">
                        <Col xs={6}>
                            <Form.Label className="small fw-semibold">Quantité minimum</Form.Label>
                            <Form.Control
                                type="number"
                                size="sm"
                                min={0}
                                value={qteMin}
                                onChange={e => setQteMin(Number(e.target.value))}
                            />
                            <Form.Text className="text-muted">Seuil de réapprovisionnement</Form.Text>
                        </Col>
                        <Col xs={6}>
                            <Form.Label className="small fw-semibold">Quantité maximum</Form.Label>
                            <Form.Control
                                type="number"
                                size="sm"
                                min={0}
                                value={qteMax}
                                onChange={e => setQteMax(Number(e.target.value))}
                            />
                            <Form.Text className="text-muted">Stock maximum conseillé</Form.Text>
                        </Col>
                    </Row>
                    <div className="mt-3 p-2 bg-light rounded small">
                        <strong>Stock actuel :</strong> {modalSeuil.item?.QteEnStock ?? 0} unités
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button size="sm" variant="secondary" onClick={() => setModalSeuil({ show: false, item: null })}>
                        Annuler
                    </Button>
                    <Button size="sm" variant="primary" onClick={sauvegarderSeuils} disabled={saving}>
                        {saving ? <Spinner size="sm" animation="border" className="me-1" /> : null}
                        Enregistrer
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
