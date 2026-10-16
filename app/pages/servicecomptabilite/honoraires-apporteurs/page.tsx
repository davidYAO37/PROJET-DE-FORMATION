"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { useEntreprise } from "@/hooks/useEntreprise";
import { createPrintWindow, generatePrintFooter, generatePrintHeader } from "@/utils/printRecu";
import { useRouter } from "next/navigation";

type Apporteur = { _id: string; nom: string; telephone?: string; taux: number };
type Acte = { id: string; date: string; acte: string; patient: string; montantActe: number; taux: number; netAPayer: number };
type Paiement = { _id: string; date: string; heure?: string; montant: number; resteAPayer?: number; modePaiement?: string; banque?: string; numeroCheque?: string; payePar?: string; recuPar?: string };
type Bordereau = { _id: string; Apporteur: Apporteur; date: string; debut: string; fin: string; nombreActes: number; montantTotalActes: number; taux: number; totalNetAPayer: number; montantPaye: number; resteAPayer: number; lignes: Array<{ _id: string; date: string; prestation: string; patient?: string; montantActe: number; taux: number; netAPayer: number }>; paiements: Paiement[] };
const today = () => new Date().toISOString().split("T")[0];
const fmt = (value: number) => Math.round(Number(value || 0)).toLocaleString("fr-FR");

export default function HonorairesApporteursPage() {
    const { entreprise, loading: loadingEntreprise } = useEntreprise();
    const apporteurActif = !!entreprise?.travailleAvecApporteur;
    const router = useRouter();
    const [apporteurs, setApporteurs] = useState<Apporteur[]>([]);
    const [apporteurId, setApporteurId] = useState("");
    const [dateDebut, setDateDebut] = useState(today());
    const [dateFin, setDateFin] = useState(today());
    const [actes, setActes] = useState<Acte[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bordereaux, setBordereaux] = useState<Bordereau[]>([]);
    const [onglet, setOnglet] = useState<"actes" | "historique">("actes");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);
    const [paymentTarget, setPaymentTarget] = useState<Bordereau | null>(null);
    const [paymentEdit, setPaymentEdit] = useState<{ bordereau: Bordereau; paiement: Paiement } | null>(null);
    const [montant, setMontant] = useState("");
    const [modePaiement, setModePaiement] = useState("Espèce");
    const [banque, setBanque] = useState("");
    const [numeroCheque, setNumeroCheque] = useState("");
    const [recuPar, setRecuPar] = useState("");
    const [modes, setModes] = useState<string[]>(["Espèce", "Chèque", "Virement"]);

    useEffect(() => {
        if (!apporteurActif) return;
        fetch("/api/comptabilite/honoraires-apporteurs?action=apporteurs").then(r => r.json()).then(j => setApporteurs(j.success ? j.data : []));
        fetch("/api/modepaiement").then(r => r.json()).then(j => { if (j.success && Array.isArray(j.data)) setModes(j.data.map((m: any) => m.Modepaiement)); }).catch(() => {});
    }, [apporteurActif]);

    const chargerActes = useCallback(async () => {
        if (!apporteurId) return setMessage({ type: "danger", text: "Sélectionnez un apporteur." });
        setLoading(true); setMessage(null);
        const params = new URLSearchParams({ action: "actes", apporteurId, dateDebut, dateFin });
        const json = await fetch(`/api/comptabilite/honoraires-apporteurs?${params}`).then(r => r.json());
        setActes(json.success ? json.data : []); setSelected(new Set());
        if (!json.success) setMessage({ type: "danger", text: json.message || "Erreur de chargement." });
        setLoading(false);
    }, [apporteurId, dateDebut, dateFin]);

    const chargerHistorique = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ dateDebut, dateFin });
        if (apporteurId) params.set("apporteurId", apporteurId);
        const json = await fetch(`/api/comptabilite/honoraires-apporteurs?${params}`).then(r => r.json());
        setBordereaux(json.success ? json.data : []); setLoading(false);
    }, [apporteurId, dateDebut, dateFin]);

    useEffect(() => { if (onglet === "historique") chargerHistorique(); }, [onglet, chargerHistorique]);
    const totaux = useMemo(() => actes.filter(a => selected.has(a.id)).reduce((s, a) => ({ actes: s.actes + a.montantActe, net: s.net + a.netAPayer }), { actes: 0, net: 0 }), [actes, selected]);
    const historiqueTotaux = useMemo(() => bordereaux.reduce((s, b) => ({ net: s.net + b.totalNetAPayer, paye: s.paye + b.montantPaye, reste: s.reste + b.resteAPayer, actes: s.actes + b.nombreActes }), { net: 0, paye: 0, reste: 0, actes: 0 }), [bordereaux]);
    const periode = `${new Date(dateDebut).toLocaleDateString("fr-FR")} — ${new Date(dateFin).toLocaleDateString("fr-FR")}`;

    const generer = async () => {
        if (!selected.size) return setMessage({ type: "danger", text: "Sélectionnez au moins un acte." });
        setLoading(true);
        const json = await fetch("/api/comptabilite/honoraires-apporteurs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apporteurId, dateDebut, dateFin, ligneIds: [...selected] }) }).then(r => r.json());
        setMessage({ type: json.success ? "success" : "danger", text: json.success ? "Bordereau généré avec succès." : json.message });
        if (json.success) { await chargerActes(); setOnglet("historique"); }
        setLoading(false);
    };

    const ouvrirPaiement = (b: Bordereau, p?: Paiement) => {
        if (p) { setPaymentEdit({ bordereau: b, paiement: p }); setMontant(String(p.montant)); setModePaiement(p.modePaiement || "Espèce"); setBanque(p.banque || ""); setNumeroCheque(p.numeroCheque || ""); setRecuPar(p.recuPar || ""); }
        else { setPaymentTarget(b); setMontant(String(b.resteAPayer)); setModePaiement("Espèce"); setBanque(""); setNumeroCheque(""); setRecuPar(""); }
    };

    const enregistrerPaiement = async () => {
        const editing = paymentEdit;
        const target = editing?.bordereau || paymentTarget;
        if (!target) return;
        const url = editing ? `/api/comptabilite/honoraires-apporteurs/payer/${editing.paiement._id}` : "/api/comptabilite/honoraires-apporteurs/payer";
        const json = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ honoraireId: target._id, montant: Math.round(Number(montant) || 0), datePaiement: today(), modePaiement, banque, numeroCheque, recuPar }) }).then(r => r.json());
        setMessage({ type: json.success ? "success" : "danger", text: json.success ? "Paiement enregistré." : json.message });
        if (json.success) { setPaymentTarget(null); setPaymentEdit(null); await chargerHistorique(); }
    };

    const annulerPaiement = async (b: Bordereau, p: Paiement) => {
        if (!confirm(`Annuler le paiement de ${fmt(p.montant)} F ?`)) return;
        const json = await fetch(`/api/comptabilite/honoraires-apporteurs/payer/${p._id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" }).then(r => r.json());
        setMessage({ type: json.success ? "success" : "danger", text: json.success ? "Paiement annulé." : json.message });
        if (json.success) chargerHistorique();
    };

    const annulerBordereau = async (id: string) => {
        if (!confirm("Annuler ce bordereau ?")) return;
        const json = await fetch(`/api/comptabilite/honoraires-apporteurs/${id}/annuler`, { method: "POST" }).then(r => r.json());
        setMessage({ type: json.success ? "success" : "danger", text: json.success ? "Bordereau annulé." : json.message });
        if (json.success) chargerHistorique();
    };

    const imprimer = (b: Bordereau) => {
        const rows = b.lignes.map(l => `<tr><td>${new Date(l.date).toLocaleDateString("fr-FR")}</td><td>${l.patient || "-"}</td><td>${l.prestation}</td><td>${fmt(l.montantActe)}</td><td>${l.taux}%</td><td>${fmt(l.netAPayer)}</td></tr>`).join("");
        const content = `<h2>Bordereau d'honoraires apporteur</h2><p><b>Apporteur :</b> ${b.Apporteur.nom}<br/><b>Période :</b> ${new Date(b.debut).toLocaleDateString("fr-FR")} - ${new Date(b.fin).toLocaleDateString("fr-FR")}</p><table><thead><tr><th>Date</th><th>Patient</th><th>Acte</th><th>Montant</th><th>Taux</th><th>Net</th></tr></thead><tbody>${rows}</tbody></table><h3 style="text-align:right">Net à payer : ${fmt(b.totalNetAPayer)} F CFA</h3>`;
        const win = createPrintWindow("Bordereau apporteur", generatePrintHeader(entreprise), content, generatePrintFooter(entreprise));
        if (win) setTimeout(() => win.print(), 300);
    };

    const kpis = onglet === "actes"
        ? [
            { label: "Total actes sélectionnés", value: totaux.actes, icon: "bi-cash-stack", bg: "linear-gradient(135deg,#1565c0,#42a5f5)" },
            { label: "Net apporteur", value: totaux.net, icon: "bi-wallet2", bg: "linear-gradient(135deg,#00695c,#26a69a)" },
            { label: "Actes disponibles", value: actes.length, icon: "bi-list-check", bg: "linear-gradient(135deg,#6a1b9a,#ab47bc)", count: true },
            { label: "Actes sélectionnés", value: selected.size, icon: "bi-check2-square", bg: "linear-gradient(135deg,#e65100,#ffb300)", count: true },
        ]
        : [
            { label: "Net à payer", value: historiqueTotaux.net, icon: "bi-wallet2", bg: "linear-gradient(135deg,#1565c0,#42a5f5)" },
            { label: "Montant payé", value: historiqueTotaux.paye, icon: "bi-check-circle", bg: "linear-gradient(135deg,#1b5e20,#66bb6a)" },
            { label: "Reste à payer", value: historiqueTotaux.reste, icon: "bi-hourglass-split", bg: "linear-gradient(135deg,#c62828,#ef5350)" },
            { label: "Nombre d’actes", value: historiqueTotaux.actes, icon: "bi-list-check", bg: "linear-gradient(135deg,#6a1b9a,#ab47bc)", count: true },
        ];

    if (loadingEntreprise) return <div className="honoraires-apporteurs" style={{ background: "#f0f4f8", minHeight: "100vh", padding: "10px" }}><div className="text-center p-4"><Spinner /></div></div>;
    if (!apporteurActif) return <div className="honoraires-apporteurs" style={{ background: "#f0f4f8", minHeight: "100vh", padding: "10px" }}>
        <Alert variant="warning" className="m-4">
            Cette entreprise ne travaille pas avec des apporteurs. Activez l'option dans les paramètres de l'entreprise.
        </Alert>
        <div className="px-4"><Button variant="link" onClick={() => router.push('/dashboard/parametres/entreprise')}>Modifier les paramètres de l'entreprise</Button></div>
    </div>;

    return <div className="honoraires-apporteurs" style={{ background: "#f0f4f8", minHeight: "100vh", padding: "10px" }}>
        <style>{`
            .honoraires-apporteurs .dashboard-card { border: 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(15,23,42,.08); }
            .honoraires-apporteurs .table-responsive { background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(15,23,42,.08); max-height: 54vh; overflow: auto; }
            .honoraires-apporteurs table { margin-bottom: 0; font-size: .76rem; }
            .honoraires-apporteurs thead th { background: #dbe4ea; color: #37474f; padding: 8px; white-space: nowrap; position: sticky; top: 0; z-index: 1; }
            .honoraires-apporteurs tbody td { padding: 7px 8px; vertical-align: middle; }
            .honoraires-apporteurs tbody tr:nth-child(even) { background: #f8fafc; }
            .honoraires-apporteurs tbody tr:hover { background: #fff8e1; }
            .honoraires-apporteurs .form-label { color: #546e7a; font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
            .honoraires-apporteurs .form-control, .honoraires-apporteurs .form-select { border-radius: 7px; border-color: #b0bec5; font-size: .8rem; }
            .honoraires-apporteurs .btn { border-radius: 7px; font-weight: 600; }
        `}</style>
        <div style={{ background: "linear-gradient(135deg,#004d40,#00897b 55%,#4db6ac)", borderRadius: 10, padding: "13px 18px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 5px 22px rgba(0,77,64,.28)" }}>
            <div><div style={{ color: "rgba(255,255,255,.72)", fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Module Comptabilité</div><div style={{ color: "#fff", fontSize: "1.12rem", fontWeight: 800 }}>Bordereaux d’honoraires apporteurs</div><div style={{ color: "rgba(255,255,255,.75)", fontSize: ".75rem" }}>{periode}</div></div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.15)", display: "grid", placeItems: "center" }}><i className="bi bi-people-fill" style={{ fontSize: "1.6rem", color: "#fff" }} /></div>
        </div>
        {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: ".8rem" }}>{message.text}</Alert>}
        <Row className="g-2 mb-2">{kpis.map((kpi, index) => <Col key={index} xs={6} lg={3}><div style={{ background: kpi.bg, color: "#fff", borderRadius: 10, padding: "11px 13px", boxShadow: "0 3px 10px rgba(0,0,0,.12)", minHeight: 70 }}><div className="d-flex justify-content-between"><div><div style={{ fontSize: ".62rem", fontWeight: 700, opacity: .82, letterSpacing: 1, textTransform: "uppercase" }}>{kpi.label}</div><div style={{ fontSize: "1rem", fontWeight: 800, marginTop: 5 }}>{kpi.count ? kpi.value : `${fmt(kpi.value)} F`}</div></div><i className={`bi ${kpi.icon}`} style={{ fontSize: "1.35rem", opacity: .35 }} /></div></div></Col>)}</Row>
        <Card className="dashboard-card mb-2"><Card.Body className="p-3"><Row className="g-2 align-items-end"><Col xs={12} md={4}><Form.Label>Apporteur</Form.Label><Form.Select size="sm" value={apporteurId} onChange={e => setApporteurId(e.target.value)}><option value="">Tous les apporteurs</option>{apporteurs.map(a => <option key={a._id} value={a._id}>{a.nom} — taux {a.taux}%</option>)}</Form.Select></Col><Col xs={6} md={3}><Form.Label>Date de début</Form.Label><Form.Control size="sm" type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} /></Col><Col xs={6} md={3}><Form.Label>Date de fin</Form.Label><Form.Control size="sm" type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} /></Col><Col xs={12} md={2}><Button className="w-100" size="sm" disabled={loading || (onglet === "actes" && !apporteurId)} onClick={onglet === "actes" ? chargerActes : chargerHistorique} style={{ background: "linear-gradient(135deg,#00695c,#26a69a)", border: 0 }}><i className="bi bi-search me-2" />Afficher</Button></Col></Row></Card.Body></Card>
        <div className="d-flex gap-2 mb-2">{[{ key: "actes", label: "Actes à payer", icon: "bi-list-check" }, { key: "historique", label: "Historique des bordereaux", icon: "bi-clock-history" }].map(tab => <button key={tab.key} onClick={() => setOnglet(tab.key as "actes" | "historique")} style={{ border: 0, borderRadius: 8, padding: "7px 16px", fontSize: ".8rem", fontWeight: 700, background: onglet === tab.key ? "linear-gradient(135deg,#00695c,#26a69a)" : "#fff", color: onglet === tab.key ? "#fff" : "#546e7a", boxShadow: "0 2px 7px rgba(0,0,0,.08)" }}><i className={`bi ${tab.icon} me-2`} />{tab.label}</button>)}</div>
        {loading ? <div className="text-center"><Spinner /></div> : onglet === "actes" ? <><Row className="mb-3"><Col><Card body>Total sélectionné : <b>{fmt(totaux.actes)} F</b></Card></Col><Col><Card body>Net apporteur : <b>{fmt(totaux.net)} F</b></Card></Col><Col><Button className="w-100 h-100" variant="success" onClick={generer}>Générer le bordereau</Button></Col></Row><Table bordered hover responsive><thead><tr><th><Form.Check checked={actes.length > 0 && selected.size === actes.length} onChange={e => setSelected(e.target.checked ? new Set(actes.map(a => a.id)) : new Set())} /></th><th>Date</th><th>Patient</th><th>Acte</th><th>Montant acte</th><th>Taux</th><th>Net</th></tr></thead><tbody>{actes.map(a => <tr key={a.id}><td><Form.Check checked={selected.has(a.id)} onChange={() => setSelected(prev => { const n = new Set(prev); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })} /></td><td>{new Date(a.date).toLocaleDateString("fr-FR")}</td><td>{a.patient}</td><td>{a.acte}</td><td>{fmt(a.montantActe)}</td><td>{a.taux}%</td><td>{fmt(a.netAPayer)}</td></tr>)}</tbody></Table></> : <Table bordered hover responsive><thead><tr><th></th><th>Date</th><th>Apporteur</th><th>Actes</th><th>Net</th><th>Payé</th><th>Reste</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{bordereaux.map(b => <Fragment key={b._id}><tr><td><Button size="sm" variant="outline-secondary" onClick={() => setExpanded(p => { const n = new Set(p); n.has(b._id) ? n.delete(b._id) : n.add(b._id); return n; })}>{expanded.has(b._id) ? "−" : "+"}</Button></td><td>{new Date(b.date).toLocaleDateString("fr-FR")}</td><td>{b.Apporteur?.nom}</td><td>{b.nombreActes}</td><td>{fmt(b.totalNetAPayer)}</td><td>{fmt(b.montantPaye)}</td><td>{fmt(b.resteAPayer)}</td><td><Badge bg={b.resteAPayer <= 0 ? "success" : b.montantPaye > 0 ? "warning" : "secondary"}>{b.resteAPayer <= 0 ? "Payé" : b.montantPaye > 0 ? "Partiel" : "Non payé"}</Badge></td><td><Button size="sm" variant="success" disabled={b.resteAPayer <= 0} onClick={() => ouvrirPaiement(b)}>Payer</Button><Button size="sm" className="ms-1" variant="outline-primary" onClick={() => imprimer(b)}>Imprimer</Button><Button size="sm" className="ms-1" variant="outline-danger" disabled={b.montantPaye > 0} onClick={() => annulerBordereau(b._id)}>Annuler</Button></td></tr>{expanded.has(b._id) && <tr><td colSpan={9}><h6>Détail des actes</h6><Table size="sm"><tbody>{b.lignes.map(l => <tr key={l._id}><td>{new Date(l.date).toLocaleDateString("fr-FR")}</td><td>{l.patient}</td><td>{l.prestation}</td><td>{fmt(l.montantActe)}</td><td>{fmt(l.netAPayer)}</td></tr>)}</tbody></Table><h6>Paiements</h6>{b.paiements.map(p => <div key={p._id} className="d-flex gap-2 align-items-center mb-1"><span>{new Date(p.date).toLocaleDateString("fr-FR")} — {fmt(p.montant)} F — {p.modePaiement}</span><Button size="sm" variant="outline-primary" onClick={() => ouvrirPaiement(b, p)}>Modifier</Button><Button size="sm" variant="outline-danger" onClick={() => annulerPaiement(b, p)}>Annuler</Button></div>)}</td></tr>}</Fragment>)}</tbody></Table>}
        <Modal show={!!paymentTarget || !!paymentEdit} onHide={() => { setPaymentTarget(null); setPaymentEdit(null); }} centered><Modal.Header closeButton><Modal.Title>{paymentEdit ? "Modifier le paiement" : "Payer le bordereau"}</Modal.Title></Modal.Header><Modal.Body><Form.Group className="mb-2"><Form.Label>Montant</Form.Label><Form.Control type="number" min={1} value={montant} onChange={e => setMontant(e.target.value)} /></Form.Group><Form.Group className="mb-2"><Form.Label>Mode de paiement</Form.Label><Form.Select value={modePaiement} onChange={e => setModePaiement(e.target.value)}>{modes.map(m => <option key={m}>{m}</option>)}</Form.Select></Form.Group>{modePaiement.toLowerCase().includes("chèque") && <Row><Col><Form.Control placeholder="Banque" value={banque} onChange={e => setBanque(e.target.value)} /></Col><Col><Form.Control placeholder="N° chèque" value={numeroCheque} onChange={e => setNumeroCheque(e.target.value)} /></Col></Row>}<Form.Group className="mt-2"><Form.Label>Reçu par</Form.Label><Form.Control value={recuPar} onChange={e => setRecuPar(e.target.value)} /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => { setPaymentTarget(null); setPaymentEdit(null); }}>Fermer</Button><Button onClick={enregistrerPaiement}>Enregistrer</Button></Modal.Footer></Modal>
    </div>;
}
