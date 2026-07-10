"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Row, Col, Form, Button, Spinner, Table, Badge } from "react-bootstrap";
import { FaPrint, FaSync, FaFileMedical } from "react-icons/fa";
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from "@/utils/printRecu";

type TypeRapport = "stock" | "entrees" | "sorties" | "inventaire" | "historique_inventaire"
    | "fiche_inventaire" | "tableau_bord" | "indicateur_quantite";

const RAPPORTS: { key: TypeRapport; label: string }[] = [
    { key: "stock",                 label: "État du stock"             },
    { key: "entrees",               label: "Entrées de stock"          },
    { key: "sorties",               label: "Sorties de stock"          },
    { key: "inventaire",            label: "Inventaire actuel"         },
    { key: "historique_inventaire", label: "Historique des inventaires"},
    { key: "fiche_inventaire",      label: "Fiche d'inventaire"        },
    { key: "tableau_bord",          label: "Tableau de bord du stock"  },
    { key: "indicateur_quantite",   label: "Indicateur de quantité"    },
];

export default function Impression() {
    const [type, setType] = useState<TypeRapport>("stock");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const { entreprise } = useEntreprise();

    const today = new Date().toISOString().slice(0, 10);

    // État supplémentaire pour les rapports croisés
    const [entrees, setEntrees] = useState<any[]>([]);
    const [sorties, setSorties] = useState<any[]>([]);
    const [stocks,  setStocks]  = useState<any[]>([]);

    const filtrerDate = (rows: any[], champDate: string) => {
        if (!dateDebut && !dateFin) return rows;
        const debut = dateDebut ? new Date(dateDebut).getTime() : 0;
        const fin   = dateFin   ? new Date(dateFin + "T23:59:59").getTime() : Infinity;
        return rows.filter((r: any) => {
            const d = new Date(r[champDate] || r.DateAppro || r.DateSortie || r.createdAt || 0).getTime();
            return d >= debut && d <= fin;
        });
    };

    const charger = useCallback(async () => {
        setLoading(true);
        setData([]);
        try {
            if (type === "fiche_inventaire" || type === "tableau_bord" || type === "indicateur_quantite") {
                // Charger les 3 sources en parallèle
                const [invRes, entRes, sorRes] = await Promise.all([
                    fetch("/api/gestionstock/inventaire"),
                    fetch("/api/gestionstock/entrestock"),
                    fetch("/api/gestionstock/sortiestock"),
                ]);
                const [inv, ent, sor] = await Promise.all([invRes.json(), entRes.json(), sorRes.json()]);
                const invData = Array.isArray(inv) ? inv : [];
                const entData = Array.isArray(ent) ? filtrerDate(ent, "DateAppro") : [];
                const sorData = Array.isArray(sor) ? filtrerDate(sor, "DateSortie") : [];
                setStocks(invData);
                setEntrees(entData);
                setSorties(sorData);
                setData(invData); // pour le compteur
                return;
            }

            let url = "";
            const params = new URLSearchParams();
            if (dateDebut) params.set("debut", dateDebut);
            if (dateFin)   params.set("fin", dateFin);

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

            if (dateDebut || dateFin) {
                rows = filtrerDate(rows, type === "sorties" ? "DateSortie" : "DateAppro");
            }
            setData(rows);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [type, dateDebut, dateFin]);

    useEffect(() => { charger(); }, [charger]);

    const getTitre = () => `Rapport Pharmacie — ${RAPPORTS.find(r => r.key === type)?.label || ""}`;

    const getContenu = () => printRef.current?.innerHTML || "";

    const imprimerAvecEntete = () => {
        const contenu = getContenu();
        if (!contenu) return;
        const headerHTML = generatePrintHeader(entreprise);
        const footerHTML = generatePrintFooter(entreprise);
        createPrintWindow(getTitre(), headerHTML, contenu, footerHTML);
    };

    const imprimerSansEntete = () => {
        const contenu = getContenu();
        if (!contenu) return;
        createPrintWindowWithoutHeader(getTitre(), contenu);
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

        // ===== FICHE D'INVENTAIRE =====
        if (type === "fiche_inventaire") {
            return (
                <Table bordered size="sm" className="align-middle" style={{ fontSize: 11 }}>
                    <thead>
                        <tr className="text-center" style={{ background: "#b8d4e8" }}>
                            <th rowSpan={2} className="align-middle">Référence</th>
                            <th rowSpan={2} className="align-middle">Désignation</th>
                            <th colSpan={3} style={{ background: "#cce0f0" }}>Stock initial</th>
                            <th colSpan={3} style={{ background: "#d4edda" }}>Achat de marchandise</th>
                            <th colSpan={3} style={{ background: "#f8d7da" }}>Sortie de marchandise</th>
                            <th colSpan={3} style={{ background: "#fff3cd" }}>Stock final</th>
                        </tr>
                        <tr className="text-center" style={{ fontSize: 10 }}>
                            <th>Qté initiale</th><th>Prix Stock</th><th>Valeur</th>
                            <th>Qté Achetée</th><th>Prix d'achat</th><th>Montant</th>
                            <th>Qté Sortie</th><th>Prix de Revient</th><th>Valeur</th>
                            <th>Qté Restante</th><th>Prix de Vente</th><th>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map((s: any, i: number) => {
                            const matchMed = (e: any) => (e.IDMEDICAMENT && e.IDMEDICAMENT.toString() === s.IDMEDICAMENT?.toString()) || (e.Reference && e.Reference === s.Reference);
                            const entsM = entrees.filter(matchMed);
                            const sorsM = sorties.filter(matchMed);
                            const qteAchetee   = entsM.reduce((a: number, e: any) => a + (e.Quantite || 0), 0);
                            const montantAchat = entsM.reduce((a: number, e: any) => a + (e.MontantTTCE || e.PRIXTHT || 0), 0);
                            const prixAchat    = qteAchetee > 0 ? Math.round(montantAchat / qteAchetee) : 0;
                            const qteSortie    = sorsM.reduce((a: number, e: any) => a + (e.Quantite || 0), 0);
                            const valSortie    = sorsM.reduce((a: number, e: any) => a + (e.Prix_TotalS || 0), 0);
                            const prixRevient  = qteSortie > 0 ? Math.round(valSortie / qteSortie) : 0;
                            const qteInit      = (s.QteEnStock || 0) + qteSortie - qteAchetee;
                            const valInit      = qteInit * (s.PrixAchat || 0);
                            const qteFinal     = s.QteEnStock || 0;
                            const montantFinal = qteFinal * (s.PrixVente || 0);
                            return (
                                <tr key={i} className="text-center">
                                    <td className="text-start">{s.Reference || "—"}</td>
                                    <td className="text-start">{s.Medicament || "—"}</td>
                                    <td>{qteInit}</td>
                                    <td>{fmt(s.PrixAchat)} F CFA</td>
                                    <td>{fmt(valInit)} F CFA</td>
                                    <td>{qteAchetee}</td>
                                    <td>{fmt(prixAchat)} F CFA</td>
                                    <td>{fmt(montantAchat)} F CFA</td>
                                    <td>{qteSortie}</td>
                                    <td>{fmt(prixRevient)} F CFA</td>
                                    <td>{fmt(valSortie)} F CFA</td>
                                    <td className="fw-bold">{qteFinal}</td>
                                    <td>{fmt(s.PrixVente)} F CFA</td>
                                    <td className="fw-bold">{fmt(montantFinal)} F CFA</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="fw-bold text-center" style={{ background: "#e9ecef" }}>
                            <td colSpan={2} className="text-end">TOTAL</td>
                            <td></td>
                            <td></td>
                            <td>{fmt(stocks.reduce((a: number, s: any) => { const e2 = entrees.filter((e: any) => e.IDMEDICAMENT?.toString() === s.IDMEDICAMENT?.toString()); const q = e2.reduce((x: number, e: any) => x + (e.Quantite || 0), 0); const qInit = (s.QteEnStock || 0) + sorties.filter((e: any) => e.IDMEDICAMENT?.toString() === s.IDMEDICAMENT?.toString()).reduce((x: number, e: any) => x + (e.Quantite || 0), 0) - q; return a + qInit * (s.PrixAchat || 0); }, 0))} F CFA</td>
                            <td>{fmt(entrees.reduce((a: number, e: any) => a + (e.Quantite || 0), 0))}</td>
                            <td></td>
                            <td>{fmt(entrees.reduce((a: number, e: any) => a + (e.MontantTTCE || e.PRIXTHT || 0), 0))} F CFA</td>
                            <td>{fmt(sorties.reduce((a: number, e: any) => a + (e.Quantite || 0), 0))}</td>
                            <td></td>
                            <td>{fmt(sorties.reduce((a: number, e: any) => a + (e.Prix_TotalS || 0), 0))} F CFA</td>
                            <td>{fmt(stocks.reduce((a: number, s: any) => a + (s.QteEnStock || 0), 0))}</td>
                            <td></td>
                            <td>{fmt(stocks.reduce((a: number, s: any) => a + (s.QteEnStock || 0) * (s.PrixVente || 0), 0))} F CFA</td>
                        </tr>
                    </tfoot>
                </Table>
            );
        }

        // ===== TABLEAU DE BORD DU STOCK =====
        if (type === "tableau_bord") {
            return (
                <Table bordered size="sm" className="align-middle" style={{ fontSize: 10 }}>
                    <thead>
                        <tr className="text-center" style={{ background: "#d0d0d0" }}>
                            <th rowSpan={2} className="align-middle">Référence</th>
                            <th rowSpan={2} className="align-middle">Désignation</th>
                            <th colSpan={3}>Stock initial</th>
                            <th colSpan={3}>Entrée de marchandise</th>
                            <th colSpan={3}>Sortie de marchandises</th>
                            <th colSpan={4}>Stock Final</th>
                            <th rowSpan={2} className="align-middle">Marge</th>
                        </tr>
                        <tr className="text-center" style={{ fontSize: 9, background: "#e0e0e0" }}>
                            <th>Qté initiale</th><th>Prix stock</th><th>Valeur</th>
                            <th>Qté Achetée</th><th>Prix d'achat</th><th>Montant</th>
                            <th>Qté Sortie</th><th>Prix de Revient</th><th>Total vendu</th>
                            <th>Qté Restante</th><th>Valeur stock</th><th>Qté Vendue</th><th>Montant vendu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map((s: any, i: number) => {
                            const matchMed = (e: any) => (e.IDMEDICAMENT && e.IDMEDICAMENT.toString() === s.IDMEDICAMENT?.toString()) || (e.Reference && e.Reference === s.Reference);
                            const entsM    = entrees.filter(matchMed);
                            const sorsM    = sorties.filter(matchMed);
                            const qteAchet = entsM.reduce((a: number, e: any) => a + (e.Quantite || 0), 0);
                            const montAcht = entsM.reduce((a: number, e: any) => a + (e.MontantTTCE || e.PRIXTHT || 0), 0);
                            const prixAcht = qteAchet > 0 ? Math.round(montAcht / qteAchet) : 0;
                            const qteSor   = sorsM.reduce((a: number, e: any) => a + (e.Quantite || 0), 0);
                            const totalVdu = sorsM.reduce((a: number, e: any) => a + (e.Prix_TotalS || 0), 0);
                            const prixRev  = qteSor > 0 ? Math.round(totalVdu / qteSor) : 0;
                            const qteInit  = (s.QteEnStock || 0) + qteSor - qteAchet;
                            const valInit  = qteInit * (s.PrixAchat || 0);
                            const qteFin   = s.QteEnStock || 0;
                            const valFin   = qteFin * (s.PrixAchat || 0);
                            const montVdu  = qteSor * (s.PrixVente || 0);
                            const marge    = montVdu - totalVdu;
                            return (
                                <tr key={i} className="text-center">
                                    <td className="text-start">{s.Reference || "—"}</td>
                                    <td className="text-start">{s.Medicament || "—"}</td>
                                    <td style={{ color: qteInit > 0 ? "blue" : undefined }}>{qteInit}</td>
                                    <td>{fmt(s.PrixAchat)}</td>
                                    <td>{fmt(valInit)}</td>
                                    <td>{qteAchet}</td>
                                    <td>{fmt(prixAcht)}</td>
                                    <td>{fmt(montAcht)}</td>
                                    <td style={{ color: qteSor > 0 ? "blue" : undefined }}>{qteSor}</td>
                                    <td>{fmt(prixRev)}</td>
                                    <td>{fmt(totalVdu)}</td>
                                    <td className="fw-bold">{qteFin}</td>
                                    <td>{fmt(valFin)}</td>
                                    <td>{qteSor}</td>
                                    <td>{fmt(montVdu)}</td>
                                    <td className={marge > 0 ? "text-success fw-bold" : marge < 0 ? "text-danger fw-bold" : ""}>{fmt(marge)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="fw-bold text-center" style={{ background: "#e9ecef" }}>
                            <td colSpan={2} className="text-end">TOTAL</td>
                            <td colSpan={3}></td>
                            <td>{fmt(entrees.reduce((a: number, e: any) => a + (e.Quantite || 0), 0))}</td>
                            <td></td>
                            <td>{fmt(entrees.reduce((a: number, e: any) => a + (e.MontantTTCE || e.PRIXTHT || 0), 0))}</td>
                            <td>{fmt(sorties.reduce((a: number, e: any) => a + (e.Quantite || 0), 0))}</td>
                            <td></td>
                            <td>{fmt(sorties.reduce((a: number, e: any) => a + (e.Prix_TotalS || 0), 0))}</td>
                            <td>{fmt(stocks.reduce((a: number, s: any) => a + (s.QteEnStock || 0), 0))}</td>
                            <td>{fmt(stocks.reduce((a: number, s: any) => a + (s.QteEnStock || 0) * (s.PrixAchat || 0), 0))}</td>
                            <td colSpan={2}></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </Table>
            );
        }

        // ===== INDICATEUR DE QUANTITÉ =====
        if (type === "indicateur_quantite") {
            return (
                <Table bordered size="sm" className="align-middle text-center" style={{ fontSize: 11 }}>
                    <thead className="table-dark">
                        <tr>
                            <th className="text-start">Référence</th>
                            <th className="text-start">Article</th>
                            <th>Qté Initiale</th>
                            <th>Qté Appro</th>
                            <th>Nb Appro</th>
                            <th>Qté vendue</th>
                            <th>Qté Sortie</th>
                            <th>Qté Disponible</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map((s: any, i: number) => {
                            const matchMed = (e: any) => (e.IDMEDICAMENT && e.IDMEDICAMENT.toString() === s.IDMEDICAMENT?.toString()) || (e.Reference && e.Reference === s.Reference);
                            const entsM    = entrees.filter(matchMed);
                            const sorsM    = sorties.filter(matchMed);
                            const qteAppro = entsM.reduce((a: number, e: any) => a + (e.Quantite || 0), 0);
                            const nbAppro  = entsM.length;
                            // Sorties de type vente vs manuelles
                            const sorsVente  = sorsM.filter((e: any) => !e.Motif || e.Motif === "Vente" || e.TypeMouvement === "Vente");
                            const sorsManu   = sorsM.filter((e: any) => e.Motif && e.Motif !== "Vente" && e.TypeMouvement !== "Vente");
                            const qteVendue  = sorsVente.reduce((a: number, e: any) => a + (e.Quantite || 0), 0);
                            const qteSortie  = sorsManu.reduce((a: number, e: any) => a + (e.Quantite || 0), 0);
                            const qteInit    = (s.QteEnStock || 0) + sorsM.reduce((a: number, e: any) => a + (e.Quantite || 0), 0) - qteAppro;
                            const qteDispo   = s.QteEnStock || 0;
                            const rowStyle: React.CSSProperties = qteDispo <= 0 ? { background: "#ffe6e6" } : (s.QteMinimum > 0 && qteDispo < s.QteMinimum) ? { background: "#fff3cd" } : {};
                            return (
                                <tr key={i} style={rowStyle}>
                                    <td className="text-start">{s.Reference || "—"}</td>
                                    <td className="text-start">{s.Medicament || "—"}</td>
                                    <td>{qteInit}</td>
                                    <td style={{ color: qteAppro > 0 ? "green" : undefined }}>{qteAppro}</td>
                                    <td>{nbAppro}</td>
                                    <td style={{ color: qteVendue > 0 ? "blue" : undefined }}>{qteVendue}</td>
                                    <td style={{ color: qteSortie < 0 ? "red" : undefined }}>{qteSortie > 0 ? `-${qteSortie}` : qteSortie}</td>
                                    <td className="fw-bold" style={{ color: qteDispo <= 0 ? "red" : qteDispo < (s.QteMinimum || 0) ? "orange" : "green" }}>{qteDispo}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="fw-bold" style={{ background: "#e9ecef" }}>
                            <td colSpan={2} className="text-end">TOTAL</td>
                            <td></td>
                            <td>{fmt(entrees.reduce((a: number, e: any) => a + (e.Quantite || 0), 0))}</td>
                            <td>{entrees.length}</td>
                            <td></td>
                            <td></td>
                            <td>{fmt(stocks.reduce((a: number, s: any) => a + (s.QteEnStock || 0), 0))}</td>
                        </tr>
                    </tfoot>
                </Table>
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
                        <Button size="sm" variant="outline-primary" onClick={imprimerSansEntete} disabled={!data.length || loading}>
                            <FaPrint className="me-1" /> Sans entête
                        </Button>
                        <Button size="sm" variant="primary" onClick={imprimerAvecEntete} disabled={!data.length || loading}>
                            <FaPrint className="me-1" /> Avec entête
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Zone imprimable — styles alignés avec la fenêtre d'impression */}
            <div ref={printRef} style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#222" }}>
                {/* En-tête rapport */}
                <div className="d-flex justify-content-between align-items-start mb-3 pb-2" style={{ borderBottom: "2px solid #1e3a5f" }}>
                    <div>
                        <div className="fw-bold" style={{ fontSize: 16, color: "#1e3a5f" }}>
                            <FaFileMedical className="me-2" />{labelRapport}
                        </div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                            Service Pharmacie
                            {(dateDebut || dateFin) && (
                                <span> &mdash; Période : {dateDebut ? formatDate(dateDebut) : "début"} → {dateFin ? formatDate(dateFin) : "aujourd'hui"}</span>
                            )}
                        </div>
                        <div style={{ fontSize: 11, color: "#666" }}>Généré le {formatDate(new Date())} &mdash; {data.length} enregistrement(s)</div>
                    </div>
                </div>

                {renderTable()}
            </div>

            {/* Styles aperçu identiques à l'impression */}
            <style>{`
                .table th { background: #1e3a5f !important; color: #fff !important; font-size: 11px; padding: 6px 8px; }
                .table td { font-size: 11px; padding: 5px 8px; border-bottom: 1px solid #ddd; }
                .table tbody tr:nth-child(even) { background: #f5f7fa; }
                .table tfoot td { font-weight: bold; background: #e9ecef; }
            `}</style>
        </div>
    );
}
