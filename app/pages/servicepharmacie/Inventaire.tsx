"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePagination } from "@/components/usePagination";
import Pagination from "@/components/Pagination";
import {
    Table, Badge, Spinner, Button, Form, InputGroup,
    Row, Col, Card, Alert,
} from "react-bootstrap";
import {
    FaSearch, FaSync, FaDownload, FaExclamationTriangle,
    FaCheckCircle, FaTimesCircle, FaChartBar, FaEdit, FaSave, FaTimes,
} from "react-icons/fa";

interface LigneInventaire {
    _id: string;
    IDMEDICAMENT: string;
    Medicament: string;
    Reference: string;
    QteEnStock: number;
    QteMinimum: number;
    QteMaximum: number;
    PrixAchat: number;
    PrixVente: number;
    ValeurStock: number;
    NumeroLot: string;
    DatePeremption: string | null;
    PeremeProche: boolean;
    Statut: "OK" | "CRITIQUE" | "RUPTURE" | "SURSTOCK";
    DateModif: string | null;
    // Champ de saisie inventaire
    qteComptee?: number | "";
}

const STATUT_CONFIG: Record<string, { bg: string; label: string; icon: React.ReactNode }> = {
    OK:       { bg: "success", label: "OK",        icon: <FaCheckCircle /> },
    CRITIQUE: { bg: "warning", label: "Critique",  icon: <FaExclamationTriangle /> },
    RUPTURE:  { bg: "danger",  label: "Rupture",   icon: <FaTimesCircle /> },
    SURSTOCK: { bg: "info",    label: "Sur-stock", icon: <FaExclamationTriangle /> },
};

export default function Inventaire() {
    const [data, setData] = useState<LigneInventaire[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("TOUS");
    const [filtrePereme, setFiltrePereme] = useState(false);
    const [sortCol, setSortCol] = useState<keyof LigneInventaire>("Statut");
    const [sortAsc, setSortAsc] = useState(true);
    const [modeSaisie, setModeSaisie] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);
    const [pageSize, setPageSize] = useState(20);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/gestionstock/inventaire");
            const json = await res.json();
            setData((Array.isArray(json) ? json : []).map((l: LigneInventaire) => ({ ...l, qteComptee: "" })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { charger(); }, [charger]);

    const handleSort = (col: keyof LigneInventaire) => {
        if (sortCol === col) setSortAsc(a => !a);
        else { setSortCol(col); setSortAsc(true); }
    };

    const setQte = (id: string, val: string) => {
        setData(prev => prev.map(l => l._id === id ? { ...l, qteComptee: val === "" ? "" : Math.max(0, Number(val)) } : l));
    };

    const lignesModifiees = data.filter(l => l.qteComptee !== "" && Number(l.qteComptee) !== l.QteEnStock);

    const validerInventaire = async () => {
        if (lignesModifiees.length === 0) { setMsg({ type: "danger", text: "Aucune quantité saisie." }); return; }
        if (!confirm(`Valider l'inventaire ? ${lignesModifiees.length} ligne(s) seront ajustées.`)) return;

        setSaving(true);
        setMsg(null);
        const saisiPar = localStorage.getItem("nom_utilisateur") || "Utilisateur";

        try {
            const res = await fetch("/api/gestionstock/inventaire/ajuster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    saisiPar,
                    lignes: lignesModifiees.map(l => ({
                        stockId: l._id,
                        IDMEDICAMENT: l.IDMEDICAMENT,
                        Medicament: l.Medicament,
                        Reference: l.Reference,
                        qteTheorique: l.QteEnStock,
                        qtePhysique: Number(l.qteComptee),
                    })),
                }),
            });
            const result = await res.json();
            if (result.success) {
                setMsg({ type: "success", text: `Inventaire validé : ${result.ajustements} ajustement(s) enregistré(s).` });
                setModeSaisie(false);
                charger();
            } else {
                setMsg({ type: "danger", text: result.error || "Erreur lors de la validation." });
            }
        } catch {
            setMsg({ type: "danger", text: "Erreur réseau." });
        } finally {
            setSaving(false);
        }
    };

    const annulerSaisie = () => {
        setModeSaisie(false);
        setData(prev => prev.map(l => ({ ...l, qteComptee: "" })));
    };

    const filtrees = useMemo(() => data
        .filter(l =>
            (filtreStatut === "TOUS" || l.Statut === filtreStatut) &&
            (!filtrePereme || l.PeremeProche) &&
            (
                l.Medicament?.toLowerCase().includes(search.toLowerCase()) ||
                l.Reference?.toLowerCase().includes(search.toLowerCase()) ||
                l.NumeroLot?.toLowerCase().includes(search.toLowerCase())
            )
        )
        .sort((a, b) => {
            const va: any = a[sortCol] ?? "";
            const vb: any = b[sortCol] ?? "";
            if (va < vb) return sortAsc ? -1 : 1;
            if (va > vb) return sortAsc ? 1 : -1;
            return 0;
        })
    , [data, search, filtreStatut, filtrePereme, sortCol, sortAsc]);

    const { slice: invSlice, page: invPage, totalPages: invTotalPages,
            setPage: setInvPage, reset: resetInvPage } = usePagination(filtrees, pageSize);

    const valeurTotale = filtrees.reduce((s, l) => s + (l.ValeurStock ?? 0), 0);
    const nbRuptures = data.filter(l => l.Statut === "RUPTURE").length;
    const nbCritiques = data.filter(l => l.Statut === "CRITIQUE").length;
    const nbPereme = data.filter(l => l.PeremeProche).length;

    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

    const exportCSV = () => {
        const entete = ["Médicament", "Référence", "Qte Stock", "Qte Min", "Qte Max", "Prix Achat", "Prix Vente", "Valeur Stock", "Lot", "Date Péremption", "Statut"];
        const lignes = filtrees.map(l => [
            l.Medicament, l.Reference, l.QteEnStock, l.QteMinimum, l.QteMaximum,
            l.PrixAchat, l.PrixVente, l.ValeurStock,
            l.NumeroLot, formatDate(l.DatePeremption), l.Statut,
        ]);
        const csv = [entete, ...lignes].map(r => r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventaire_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const Th = ({ col, label }: { col: keyof LigneInventaire; label: string }) => (
        <th style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => handleSort(col)}>
            {label} {sortCol === col ? (sortAsc ? "▲" : "▼") : ""}
        </th>
    );

    return (
        <div>
            {/* KPIs */}
            <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-center py-2">
                        <div className="text-muted small">Articles en stock</div>
                        <div className="fw-bold fs-4">{data.length}</div>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-center py-2 border-danger">
                        <div className="text-danger small">Ruptures</div>
                        <div className="fw-bold fs-4 text-danger">{nbRuptures}</div>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-center py-2 border-warning">
                        <div className="text-warning small">Stocks critiques</div>
                        <div className="fw-bold fs-4 text-warning">{nbCritiques}</div>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm text-center py-2 border-info">
                        <div className="text-info small">Péremptions &lt; 90j</div>
                        <div className="fw-bold fs-4 text-info">{nbPereme}</div>
                    </Card>
                </Col>
            </Row>

            {msg && <Alert variant={msg.type} dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}

            {/* Barre d'outils */}
            <Row className="g-2 mb-3 align-items-end">
                <Col md={4}>
                    <InputGroup size="sm">
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                            placeholder="Médicament, référence, lot..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); resetInvPage(); }}
                        />
                    </InputGroup>
                </Col>
                <Col md="auto">
                    <Form.Select size="sm" value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); resetInvPage(); }}>
                        <option value="TOUS">Tous les statuts</option>
                        <option value="RUPTURE">Rupture</option>
                        <option value="CRITIQUE">Critique</option>
                        <option value="SURSTOCK">Sur-stock</option>
                        <option value="OK">OK</option>
                    </Form.Select>
                </Col>
                <Col md="auto">
                    <Form.Check
                        type="switch"
                        label="Péremption proche"
                        checked={filtrePereme}
                        onChange={e => { setFiltrePereme(e.target.checked); resetInvPage(); }}
                    />
                </Col>
                <Col md="auto" className="ms-auto d-flex gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={charger}><FaSync /></Button>
                    <Button size="sm" variant="outline-success" onClick={exportCSV}><FaDownload className="me-1" /> CSV</Button>
                    {!modeSaisie ? (
                        <Button size="sm" variant="primary" onClick={() => setModeSaisie(true)}>
                            <FaEdit className="me-1" /> Saisir inventaire
                        </Button>
                    ) : (
                        <>
                            <Button size="sm" variant="outline-danger" onClick={annulerSaisie} disabled={saving}>
                                <FaTimes className="me-1" /> Annuler
                            </Button>
                            <Button size="sm" variant="success" onClick={validerInventaire} disabled={saving}>
                                {saving ? <Spinner size="sm" animation="border" className="me-1" /> : <FaSave className="me-1" />}
                                Valider ({lignesModifiees.length})
                            </Button>
                        </>
                    )}
                </Col>
            </Row>

            {modeSaisie && (
                <Alert variant="info" className="py-2 mb-3">
                    <strong>Mode saisie inventaire</strong> — Entrez la quantité physiquement comptée dans la colonne <em>"Qte comptée"</em>.
                    Seules les lignes avec une valeur saisie différente du stock théorique seront ajustées.
                </Alert>
            )}

            {/* Valeur totale */}
            <div className="d-flex align-items-center gap-2 mb-2">
                <FaChartBar className="text-primary" />
                <span className="small text-muted">
                    Valeur totale : <strong className="ms-1 text-dark">{valeurTotale.toLocaleString("fr-FR")} FCFA</strong>
                    <span className="ms-2 text-muted">({filtrees.length} article{filtrees.length > 1 ? "s" : ""})</span>
                </span>
            </div>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /> Chargement de l'inventaire...</div>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover size="sm" className="align-middle" style={{ fontSize: 13 }}>
                        <thead className="table-dark text-center">
                            <tr>
                                <Th col="Statut" label="Statut" />
                                <Th col="Medicament" label="Médicament" />
                                <Th col="Reference" label="Référence" />
                                <Th col="QteEnStock" label="Qte théorique" />
                                {modeSaisie && <th className="table-warning">Qte comptée</th>}
                                {modeSaisie && <th className="table-warning">Écart</th>}
                                <Th col="QteMinimum" label="Min" />
                                <Th col="QteMaximum" label="Max" />
                                <Th col="PrixAchat" label="P. Achat" />
                                <Th col="PrixVente" label="P. Vente" />
                                <Th col="ValeurStock" label="Valeur" />
                                <Th col="NumeroLot" label="N° Lot" />
                                <Th col="DatePeremption" label="Péremption" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtrees.length === 0 ? (
                                <tr><td colSpan={modeSaisie ? 14 : 12} className="text-center text-muted py-4">Aucun article trouvé.</td></tr>
                            ) : invSlice.map((l, idx) => {
                                const cfg = STATUT_CONFIG[l.Statut] ?? STATUT_CONFIG["OK"];
                                const rowClass = l.Statut === "RUPTURE" ? "table-danger" : l.Statut === "CRITIQUE" ? "table-warning" : "";
                                const qteComptee = l.qteComptee;
                                const ecart = qteComptee !== "" ? Number(qteComptee) - l.QteEnStock : null;
                                const estModifie = qteComptee !== "" && Number(qteComptee) !== l.QteEnStock;

                                return (
                                    <tr key={l._id ?? idx} className={estModifie ? "table-primary" : rowClass}>
                                        <td className="text-center">
                                            <Badge bg={cfg.bg} className="d-flex align-items-center gap-1 justify-content-center">
                                                {cfg.icon} {cfg.label}
                                            </Badge>
                                        </td>
                                        <td className="fw-semibold">
                                            {l.Medicament || "—"}
                                            {l.PeremeProche && (
                                                <Badge bg="danger" className="ms-1" style={{ fontSize: 9 }}>
                                                    <FaExclamationTriangle /> Périme bientôt
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="text-center">{l.Reference || "—"}</td>
                                        <td className="text-center fw-bold">{l.QteEnStock}</td>
                                        {modeSaisie && (
                                            <td className="text-center p-1">
                                                <Form.Control
                                                    type="number"
                                                    min={0}
                                                    size="sm"
                                                    style={{ width: 80, margin: "0 auto", textAlign: "center" }}
                                                    value={qteComptee}
                                                    placeholder={String(l.QteEnStock)}
                                                    onChange={e => setQte(l._id, e.target.value)}
                                                />
                                            </td>
                                        )}
                                        {modeSaisie && (
                                            <td className="text-center fw-bold">
                                                {ecart === null ? "—" : (
                                                    <span className={ecart > 0 ? "text-success" : ecart < 0 ? "text-danger" : "text-muted"}>
                                                        {ecart > 0 ? `+${ecart}` : ecart}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="text-center text-muted">{l.QteMinimum || "—"}</td>
                                        <td className="text-center text-muted">{l.QteMaximum || "—"}</td>
                                        <td className="text-end">{(l.PrixAchat || 0).toLocaleString("fr-FR")}</td>
                                        <td className="text-end">{(l.PrixVente || 0).toLocaleString("fr-FR")}</td>
                                        <td className="text-end fw-semibold">{(l.ValeurStock || 0).toLocaleString("fr-FR")}</td>
                                        <td className="text-center">{l.NumeroLot || "—"}</td>
                                        <td className={`text-center ${l.PeremeProche ? "text-danger fw-bold" : ""}`}>
                                            {formatDate(l.DatePeremption)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {filtrees.length > 0 && (
                            <tfoot className="table-secondary fw-bold">
                                <tr>
                                    <td colSpan={modeSaisie ? 9 : 7} className="text-end pe-3">TOTAL</td>
                                    <td className="text-end">{valeurTotale.toLocaleString("fr-FR")}</td>
                                    <td colSpan={modeSaisie ? 3 : 2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                    <Pagination page={invPage} totalPages={invTotalPages} total={filtrees.length}
                        pageSize={pageSize} onPage={setInvPage}
                        onPageSize={n => { setPageSize(n); resetInvPage(); }} />
                </div>
            )}
        </div>
    );
}
