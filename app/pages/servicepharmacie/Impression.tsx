"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Row, Col, Form, Button, Spinner, Table, Badge } from "react-bootstrap";
import { FaPrint, FaSync, FaFileMedical } from "react-icons/fa";

type TypeRapport = "stock" | "entrees" | "sorties" | "inventaire" | "historique_inventaire";

const RAPPORTS: { key: TypeRapport; label: string }[] = [
    { key: "stock",                 label: "État du stock"            },
    { key: "entrees",               label: "Entrées de stock"         },
    { key: "sorties",               label: "Sorties de stock"         },
    { key: "inventaire",            label: "Inventaire actuel"        },
    { key: "historique_inventaire", label: "Historique des inventaires" },
];

export default function Impression() {
    const [type, setType] = useState<TypeRapport>("stock");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const today = new Date().toISOString().slice(0, 10);

    const charger = useCallback(async () => {
        setLoading(true);
        setData([]);
        try {
            let url = "";
            const params = new URLSearchParams();
            if (dateDebut) params.set("debut", dateDebut);
            if (dateFin) params.set("fin", dateFin);

            if (type === "stock" || type === "inventaire") {
                url = "/api/gestionstock/inventaire";
            } else if (type === "entrees") {
                url = "/api/gestionstock/entrestock";
            } else if (type === "sorties") {
                url = "/api/gestionstock/sortiestock";
            } else if (type === "historique_inventaire") {
                url = "/api/gestionstock/inventaire/historique";
            }

            const res = await fetch(`${url}${params.toString() ? "?" + params.toString() : ""}`);
            const json = await res.json();
            let rows = Array.isArray(json) ? json : [];

            // Filtrer par date côté client si nécessaire
            if (dateDebut || dateFin) {
                const debut = dateDebut ? new Date(dateDebut).getTime() : 0;
                const fin = dateFin ? new Date(dateFin + "T23:59:59").getTime() : Infinity;
                rows = rows.filter((r: any) => {
                    const d = new Date(r.DateAppro || r.DateSortie || r.DateInventaire || r.createdAt || 0).getTime();
                    return d >= debut && d <= fin;
                });
            }

            setData(rows);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [type, dateDebut, dateFin]);

    useEffect(() => { charger(); }, [charger]);

    const imprimer = () => {
        const contenu = printRef.current?.innerHTML;
        if (!contenu) return;
        const win = window.open("", "_blank", "width=1100,height=800");
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8"/>
                <title>Rapport Pharmacie — ${RAPPORTS.find(r => r.key === type)?.label}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, sans-serif; font-size: 12px; color: #222; padding: 20px; }
                    h2 { font-size: 18px; margin-bottom: 4px; }
                    .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
                    td { padding: 5px 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
                    tr:nth-child(even) { background: #f5f7fa; }
                    .badge-success { background:#198754; color:#fff; padding:2px 6px; border-radius:4px; }
                    .badge-danger  { background:#dc3545; color:#fff; padding:2px 6px; border-radius:4px; }
                    .badge-warning { background:#ffc107; color:#000; padding:2px 6px; border-radius:4px; }
                    .badge-info    { background:#0dcaf0; color:#000; padding:2px 6px; border-radius:4px; }
                    tfoot td { font-weight: bold; background: #e9ecef; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>${contenu}</body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 400);
    };

    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
    const fmt = (n: any) => (Number(n) || 0).toLocaleString("fr-FR");

    const labelRapport = RAPPORTS.find(r => r.key === type)?.label || "";

    // ===== Tables par type =====
    const renderTable = () => {
        if (loading) return <div className="text-center py-4"><Spinner animation="border" /></div>;
        if (!data.length) return <p className="text-muted text-center py-4">Aucune donnée pour ces critères.</p>;

        if (type === "stock" || type === "inventaire") {
            const total = data.reduce((s: number, l: any) => s + (l.ValeurStock || 0), 0);
            return (
                <Table bordered size="sm" className="align-middle">
                    <thead className="table-dark">
                        <tr><th>Médicament</th><th>Référence</th><th>Qte Stock</th><th>Min</th><th>Max</th><th>P.Achat</th><th>P.Vente</th><th>Valeur</th><th>N° Lot</th><th>Péremption</th><th>Statut</th></tr>
                    </thead>
                    <tbody>
                        {data.map((l: any, i: number) => (
                            <tr key={i}>
                                <td>{l.Medicament || "—"}</td>
                                <td>{l.Reference || "—"}</td>
                                <td className="text-center fw-bold">{l.QteEnStock ?? 0}</td>
                                <td className="text-center">{l.QteMinimum || "—"}</td>
                                <td className="text-center">{l.QteMaximum || "—"}</td>
                                <td className="text-end">{fmt(l.PrixAchat)}</td>
                                <td className="text-end">{fmt(l.PrixVente)}</td>
                                <td className="text-end fw-bold">{fmt(l.ValeurStock)}</td>
                                <td>{l.NumeroLot || "—"}</td>
                                <td className={l.PeremeProche ? "text-danger fw-bold" : ""}>{formatDate(l.DatePeremption)}</td>
                                <td><Badge bg={l.Statut === "OK" ? "success" : l.Statut === "RUPTURE" ? "danger" : l.Statut === "CRITIQUE" ? "warning" : "info"}>{l.Statut}</Badge></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr><td colSpan={7} className="text-end pe-2">TOTAL</td><td className="text-end">{total.toLocaleString("fr-FR")}</td><td colSpan={3}></td></tr></tfoot>
                </Table>
            );
        }

        if (type === "entrees") {
            const total = data.reduce((s: number, l: any) => s + (l.MontantTTCE || 0), 0);
            return (
                <Table bordered size="sm" className="align-middle">
                    <thead className="table-dark">
                        <tr><th>Date</th><th>Médicament</th><th>Référence</th><th>Quantité</th><th>P.Achat</th><th>P.Vente</th><th>TVA%</th><th>Total TTC</th><th>N° Lot</th><th>Péremption</th><th>Saisi par</th><th>Observations</th></tr>
                    </thead>
                    <tbody>
                        {data.map((l: any, i: number) => (
                            <tr key={i}>
                                <td>{formatDate(l.DateAppro)}</td>
                                <td className="fw-semibold">{l.Medicament || "—"}</td>
                                <td>{l.Reference || "—"}</td>
                                <td className="text-center">{l.Quantite ?? 0}</td>
                                <td className="text-end">{fmt(l.PrixAchat)}</td>
                                <td className="text-end">{fmt(l.PrixVente)}</td>
                                <td className="text-center">{l.TVAEntree ?? 0}%</td>
                                <td className="text-end fw-bold">{fmt(l.MontantTTCE)}</td>
                                <td>{l.NumeroLot || "—"}</td>
                                <td>{formatDate(l.DatePeremption)}</td>
                                <td>{l.SaisiPar || "—"}</td>
                                <td>{l.Observations || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr><td colSpan={7} className="text-end pe-2">TOTAL</td><td className="text-end">{total.toLocaleString("fr-FR")}</td><td colSpan={4}></td></tr></tfoot>
                </Table>
            );
        }

        if (type === "sorties") {
            const total = data.reduce((s: number, l: any) => s + (l.Prix_TotalS || 0), 0);
            return (
                <Table bordered size="sm" className="align-middle">
                    <thead className="table-dark">
                        <tr><th>Date</th><th>Médicament</th><th>Référence</th><th>Quantité</th><th>P.Unitaire</th><th>Total</th><th>Motif</th><th>Saisi par</th><th>Observations</th></tr>
                    </thead>
                    <tbody>
                        {data.map((l: any, i: number) => (
                            <tr key={i}>
                                <td>{formatDate(l.DateSortie)}</td>
                                <td className="fw-semibold">{l.ArticleS || "—"}</td>
                                <td>{l.Reference || "—"}</td>
                                <td className="text-center">{l.Quantite ?? 0}</td>
                                <td className="text-end">{fmt(l.Prix_unitaire)}</td>
                                <td className="text-end fw-bold">{fmt(l.Prix_TotalS)}</td>
                                <td><Badge bg="secondary">{l.Motif || "—"}</Badge></td>
                                <td>{l.SaisiPar || "—"}</td>
                                <td>{l.Observations || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr><td colSpan={5} className="text-end pe-2">TOTAL</td><td className="text-end">{total.toLocaleString("fr-FR")}</td><td colSpan={3}></td></tr></tfoot>
                </Table>
            );
        }

        if (type === "historique_inventaire") {
            return (
                <div>
                    {data.map((session: any, i: number) => (
                        <div key={i} className="mb-4">
                            <div className="d-flex gap-3 align-items-center mb-1">
                                <strong>Inventaire du {formatDate(session.DateInventaire)}</strong>
                                <span className="text-muted small">— Saisi par : {session.SaisiPar || "—"}</span>
                                <Badge bg="primary">{session.NbLignes} ajustement(s)</Badge>
                            </div>
                            <Table bordered size="sm">
                                <thead className="table-secondary">
                                    <tr><th>Médicament</th><th>Référence</th><th>Qte théorique</th><th>Qte comptée</th><th>Écart</th></tr>
                                </thead>
                                <tbody>
                                    {(session.Lignes || []).map((l: any, j: number) => (
                                        <tr key={j}>
                                            <td>{l.Medicament || "—"}</td>
                                            <td>{l.Reference || "—"}</td>
                                            <td className="text-center">{l.QteTheorique}</td>
                                            <td className="text-center">{l.QtePhysique}</td>
                                            <td className={`text-center fw-bold ${l.Ecart > 0 ? "text-success" : l.Ecart < 0 ? "text-danger" : ""}`}>
                                                {l.Ecart > 0 ? `+${l.Ecart}` : l.Ecart}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div>
            {/* Filtres */}
            <div className="bg-light rounded p-3 mb-4 border">
                <Row className="g-3 align-items-end">
                    <Col md={4}>
                        <Form.Label className="fw-semibold small">Type de rapport</Form.Label>
                        <Form.Select size="sm" value={type} onChange={e => setType(e.target.value as TypeRapport)}>
                            {RAPPORTS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </Form.Select>
                    </Col>
                    {type !== "stock" && type !== "inventaire" && (
                        <>
                            <Col md={3}>
                                <Form.Label className="fw-semibold small">Du</Form.Label>
                                <Form.Control size="sm" type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} max={today} />
                            </Col>
                            <Col md={3}>
                                <Form.Label className="fw-semibold small">Au</Form.Label>
                                <Form.Control size="sm" type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} max={today} />
                            </Col>
                        </>
                    )}
                    <Col md="auto" className="ms-auto d-flex gap-2">
                        <Button size="sm" variant="outline-secondary" onClick={charger}><FaSync /></Button>
                        <Button size="sm" variant="primary" onClick={imprimer} disabled={!data.length || loading}>
                            <FaPrint className="me-1" /> Imprimer
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Zone imprimable */}
            <div ref={printRef}>
                {/* En-tête rapport */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                            <FaFileMedical className="text-primary" /> {labelRapport}
                        </h5>
                        <div className="text-muted small">
                            Service Pharmacie
                            {(dateDebut || dateFin) && (
                                <span> &mdash; Période : {dateDebut ? formatDate(dateDebut) : "début"} → {dateFin ? formatDate(dateFin) : "aujourd'hui"}</span>
                            )}
                        </div>
                        <div className="text-muted small">Généré le {formatDate(new Date())} &mdash; {data.length} enregistrement(s)</div>
                    </div>
                </div>

                {renderTable()}
            </div>
        </div>
    );
}
