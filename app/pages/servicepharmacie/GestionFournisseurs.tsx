"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Table, Button, Form, Modal, Row, Col,
    Spinner, Badge, InputGroup, Alert, Offcanvas, Card,
} from "react-bootstrap";
import { FaPlus, FaEdit, FaSearch, FaSync, FaTruck, FaChartBar, FaCalendarAlt, FaPrint } from "react-icons/fa";
import { usePagination } from "@/components/usePagination";
import Pagination from "@/components/Pagination";
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from "@/utils/printRecu";

interface LigneAppro {
    _id?: string;
    Medicament?: string;
    Reference?: string;
    Quantite?: number;
    PrixAchat?: number;
    PrixVente?: number;
    PRIXTHT?: number;
    TVAEntree?: number;
    MontantTTCE?: number;
    NumeroLot?: string;
    DatePeremption?: string;
}

interface ApproDetail {
    _id?: string;
    DateAppro?: string;
    NumeroFacture?: string;
    MontantTTC?: number;
    PrixHT?: number;
    tVAApro?: number;
    SaisiPar?: string;
    lignes?: LigneAppro[];
    loading?: boolean;
}

interface Fournisseur {
    _id?: string;
    Nom?: string;
    Contact?: string;
    Telephone?: string;
    Email?: string;
    Adresse?: string;
    Ville?: string;
    NIF?: string;
    Observations?: string;
    Actif?: boolean;
}

const VIDE: Fournisseur = {
    Nom: "", Contact: "", Telephone: "", Email: "",
    Adresse: "", Ville: "", NIF: "", Observations: "", Actif: true,
};

export default function GestionFournisseurs() {
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [loading, setLoading]           = useState(false);
    const [search, setSearch]             = useState("");
    const [showModal, setShowModal]       = useState(false);
    const [editing, setEditing]           = useState<Fournisseur | null>(null);
    const [form, setForm]                 = useState<Fournisseur>(VIDE);
    const [saving, setSaving]             = useState(false);
    const [error, setError]               = useState("");
    const [success, setSuccess]           = useState("");

    // Détail achats par période
    const [showDetail, setShowDetail]         = useState(false);
    const [fournisseurDetail, setFournisseurDetail] = useState<Fournisseur | null>(null);
    const [dateDebut, setDateDebut]           = useState("");
    const [dateFin, setDateFin]               = useState("");
    const [appros, setAppros]                 = useState<ApproDetail[]>([]);
    const [loadingAppros, setLoadingAppros]   = useState(false);
    const [expandedAppro, setExpandedAppro]   = useState<string | null>(null);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/fournisseur");
            const data = await res.json();
            setFournisseurs(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { charger(); }, [charger]);

    const filtered = fournisseurs.filter(f =>
        !search ||
        (f.Nom || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.Telephone || "").includes(search) ||
        (f.Ville || "").toLowerCase().includes(search.toLowerCase())
    );

    const { slice, page, totalPages, setPage, reset } = usePagination(filtered, 15);

    const ouvrirAjout = () => {
        setEditing(null);
        setForm(VIDE);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const ouvrirEdition = (f: Fournisseur) => {
        setEditing(f);
        setForm({ ...f });
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.Nom?.trim()) { setError("Le nom du fournisseur est obligatoire."); return; }
        setSaving(true); setError(""); setSuccess("");
        try {
            if (editing?._id) {
                const res = await fetch(`/api/fournisseur/${editing._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                if (!res.ok) throw new Error("Erreur lors de la modification.");
                setSuccess("Fournisseur modifié avec succès.");
            } else {
                const res = await fetch("/api/fournisseur", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                if (!res.ok) throw new Error("Erreur lors de la création.");
                setSuccess("Fournisseur créé avec succès.");
            }
            charger();
            setTimeout(() => setShowModal(false), 900);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleActif = async (f: Fournisseur) => {
        if (!f._id) return;
        await fetch(`/api/fournisseur/${f._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Actif: !f.Actif }),
        });
        charger();
    };

    const ouvrirDetail = (f: Fournisseur) => {
        setFournisseurDetail(f);
        setAppros([]);
        setExpandedAppro(null);
        setShowDetail(true);
    };

    const chargerAppros = useCallback(async () => {
        if (!fournisseurDetail?._id) return;
        setLoadingAppros(true);
        try {
            const params = new URLSearchParams({ IDFournisseur: fournisseurDetail._id });
            if (dateDebut) params.set("dateDebut", dateDebut);
            if (dateFin)   params.set("dateFin",   dateFin);
            const res  = await fetch(`/api/approvisionnement?${params}`);
            const data = await res.json();
            setAppros(Array.isArray(data) ? data.map((a: any) => ({ ...a, lignes: undefined, loading: false })) : []);
        } catch { } finally { setLoadingAppros(false); }
    }, [fournisseurDetail, dateDebut, dateFin]);

    const chargerLignes = async (appro: ApproDetail) => {
        if (!appro._id) return;
        if (expandedAppro === appro._id) { setExpandedAppro(null); return; }
        setExpandedAppro(appro._id);
        if (appro.lignes) return;
        setAppros(prev => prev.map(a => a._id === appro._id ? { ...a, loading: true } : a));
        try {
            const res  = await fetch(`/api/gestionstock/entrestock?idappro=${appro._id}`);
            const data = await res.json();
            setAppros(prev => prev.map(a => a._id === appro._id ? { ...a, lignes: Array.isArray(data) ? data : [], loading: false } : a));
        } catch {
            setAppros(prev => prev.map(a => a._id === appro._id ? { ...a, loading: false } : a));
        }
    };

    const totaux = useMemo(() => ({
        montant: appros.reduce((s, a) => s + (a.MontantTTC || 0), 0),
        ht:      appros.reduce((s, a) => s + (a.PrixHT || 0), 0),
        tva:     appros.reduce((s, a) => s + (a.tVAApro || 0), 0),
        nb:      appros.length,
    }), [appros]);

    const fmt  = (d: any) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
    const fmtN = (n: number) => n.toLocaleString("fr-FR");

    const { entreprise } = useEntreprise();

    const buildPrintContent = () => {
        const periode = (dateDebut || dateFin)
            ? `Période : ${dateDebut ? fmt(dateDebut) : "début"} → ${dateFin ? fmt(dateFin) : "aujourd'hui"}`
            : "Toutes périodes";

        const lignesRows = appros.map(a => {
            const lignes = a.lignes || [];
            const sousTotal = lignes.reduce((s, l) => s + (l.MontantTTCE || 0), 0);
            const lignesHTML = lignes.length > 0 ? lignes.map(l => `
                <tr>
                    <td style="padding:4px 6px;font-weight:600">${l.Medicament || "—"}</td>
                    <td style="padding:4px 6px;text-align:center">${l.Reference || "—"}</td>
                    <td style="padding:4px 6px;text-align:center;font-weight:bold">${l.Quantite ?? 0}</td>
                    <td style="padding:4px 6px;text-align:right">${fmtN(l.PrixAchat || 0)}</td>
                    <td style="padding:4px 6px;text-align:right">${fmtN(l.PrixVente || 0)}</td>
                    <td style="padding:4px 6px;text-align:right">${fmtN(l.PRIXTHT || 0)}</td>
                    <td style="padding:4px 6px;text-align:right;font-weight:bold">${fmtN(l.MontantTTCE || 0)}</td>
                    <td style="padding:4px 6px;text-align:center">${l.NumeroLot || "—"}</td>
                    <td style="padding:4px 6px;text-align:center">${l.DatePeremption ? fmt(l.DatePeremption) : "—"}</td>
                </tr>`).join("") : `<tr><td colspan="9" style="text-align:center;color:#999;padding:6px">Aucun détail disponible — cliquer pour développer avant d'imprimer</td></tr>`;

            return `
            <div style="margin-bottom:18px;page-break-inside:avoid">
                <div style="background:#1e3a5f;color:#fff;padding:6px 10px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;align-items:center">
                    <div style="font-weight:bold;font-size:13px">${fmt(a.DateAppro)}${a.NumeroFacture ? ` &mdash; Facture : ${a.NumeroFacture}` : ""}<span style="font-weight:normal;font-size:11px;margin-left:12px">Saisi par : ${a.SaisiPar || "—"}</span></div>
                    <div style="font-weight:bold;font-size:13px">${fmtN(a.MontantTTC || 0)} FCFA</div>
                </div>
                <table width="100%" style="border-collapse:collapse;font-size:11px">
                    <thead style="background:#e8f4fd">
                        <tr>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:left">Médicament</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:center">Réf.</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:center">Qté</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:right">P. Achat</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:right">P. Vente</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:right">HT</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:right">TTC</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:center">N° Lot</th>
                            <th style="padding:4px 6px;border:1px solid #ddd;text-align:center">Péremption</th>
                        </tr>
                    </thead>
                    <tbody>${lignesHTML}</tbody>
                    ${lignes.length > 0 ? `<tfoot><tr style="background:#f0f4f8;font-weight:bold"><td colspan="6" style="padding:4px 6px;border:1px solid #ddd;text-align:right">Sous-total</td><td style="padding:4px 6px;border:1px solid #ddd;text-align:right;color:#198754">${fmtN(sousTotal)} FCFA</td><td colspan="2" style="border:1px solid #ddd"></td></tr></tfoot>` : ""}
                </table>
            </div>`;
        }).join("");

        return `
        <div style="font-family:Arial,sans-serif;font-size:12px;color:#222">
            <div style="border-bottom:2px solid #1e3a5f;padding-bottom:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end">
                <div>
                    <div style="font-size:16px;font-weight:bold;color:#1e3a5f">Historique des achats &mdash; ${fournisseurDetail?.Nom || ""}</div>
                    <div style="font-size:11px;color:#666;margin-top:2px">${periode} &mdash; Généré le ${fmt(new Date())}</div>
                </div>
                <div style="display:flex;gap:16px;text-align:center">
                    <div style="background:#e8f4fd;padding:6px 12px;border-radius:4px"><div style="font-size:10px;color:#666">Commandes</div><div style="font-size:16px;font-weight:bold">${totaux.nb}</div></div>
                    <div style="background:#e8f8ef;padding:6px 12px;border-radius:4px"><div style="font-size:10px;color:#666">Total HT</div><div style="font-size:14px;font-weight:bold">${fmtN(totaux.ht)} FCFA</div></div>
                    <div style="background:#fff8e1;padding:6px 12px;border-radius:4px"><div style="font-size:10px;color:#666">TVA</div><div style="font-size:14px;font-weight:bold">${fmtN(totaux.tva)} FCFA</div></div>
                    <div style="background:#e3f2fd;padding:6px 12px;border-radius:4px"><div style="font-size:10px;color:#666">Total TTC</div><div style="font-size:16px;font-weight:bold;color:#0d6efd">${fmtN(totaux.montant)} FCFA</div></div>
                </div>
            </div>
            ${lignesRows || "<p style='text-align:center;color:#999'>Aucun approvisionnement pour cette période.</p>"}
        </div>`;
    };

    const imprimerAvecEntete = () => {
        const contenu = buildPrintContent();
        const headerHTML = generatePrintHeader(entreprise);
        const footerHTML = generatePrintFooter(entreprise);
        createPrintWindow(`Achats — ${fournisseurDetail?.Nom}`, headerHTML, contenu, footerHTML);
    };

    const imprimerSansEntete = () => {
        const contenu = buildPrintContent();
        createPrintWindowWithoutHeader(`Achats — ${fournisseurDetail?.Nom}`, contenu);
    };

    return (
        <div>
            {/* Barre outils */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                    <FaTruck className="text-warning" /> Gestion des fournisseurs
                </h5>
                <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={charger}><FaSync /></Button>
                    <Button size="sm" variant="success" onClick={ouvrirAjout}>
                        <FaPlus className="me-1" /> Nouveau fournisseur
                    </Button>
                </div>
            </div>

            {/* Filtre */}
            <div className="mb-3">
                <InputGroup size="sm" style={{ maxWidth: 320 }}>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                        placeholder="Nom, téléphone, ville..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); reset(); }}
                    />
                    {search && (
                        <Button variant="outline-secondary" onClick={() => { setSearch(""); reset(); }}>✕</Button>
                    )}
                </InputGroup>
                <span className="text-muted small ms-2">{filtered.length} fournisseur(s)</span>
            </div>

            {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-muted py-4">Aucun fournisseur trouvé.</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <Table bordered hover size="sm" className="align-middle">
                            <thead className="table-dark text-center">
                                <tr>
                                    <th>Nom</th>
                                    <th>Contact</th>
                                    <th>Téléphone</th>
                                    <th>Email</th>
                                    <th>Ville</th>
                                    <th>NIF</th>
                                    <th>Statut</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {slice.map((f, i) => (
                                    <tr key={f._id ?? i}>
                                        <td className="fw-semibold">{f.Nom || "—"}</td>
                                        <td>{f.Contact || "—"}</td>
                                        <td>{f.Telephone || "—"}</td>
                                        <td>{f.Email || "—"}</td>
                                        <td>{f.Ville || "—"}</td>
                                        <td>{f.NIF || "—"}</td>
                                        <td className="text-center">
                                            <Badge
                                                bg={f.Actif ? "success" : "secondary"}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => toggleActif(f)}
                                                title="Cliquer pour changer le statut"
                                            >
                                                {f.Actif ? "Actif" : "Inactif"}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex gap-1 justify-content-center">
                                                <Button size="sm" variant="outline-info" onClick={() => ouvrirDetail(f)} title="Voir achats par période">
                                                    <FaChartBar />
                                                </Button>
                                                <Button size="sm" variant="outline-primary" onClick={() => ouvrirEdition(f)} title="Modifier">
                                                    <FaEdit />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    <Pagination
                        page={page} totalPages={totalPages}
                        total={filtered.length} pageSize={15}
                        onPage={setPage}
                        onPageSize={() => {}}
                    />
                </>
            )}

            {/* Offcanvas — Détail achats par période */}
            <Offcanvas show={showDetail} onHide={() => setShowDetail(false)} placement="end" style={{ width: "min(820px, 95vw)" }}>
                <Offcanvas.Header closeButton className="border-bottom">
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                        <Offcanvas.Title className="d-flex align-items-center gap-2 mb-0">
                            <FaChartBar className="text-info" />
                            Achats — <span className="text-primary">{fournisseurDetail?.Nom}</span>
                        </Offcanvas.Title>
                        {appros.length > 0 && (
                            <div className="d-flex gap-2">
                                <Button size="sm" variant="outline-secondary" onClick={imprimerSansEntete} title="Imprimer sans entête">
                                    <FaPrint className="me-1" /> Sans entête
                                </Button>
                                <Button size="sm" variant="primary" onClick={imprimerAvecEntete} title="Imprimer avec entête">
                                    <FaPrint className="me-1" /> Avec entête
                                </Button>
                            </div>
                        )}
                    </div>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column p-0">
                    {/* Filtres période */}
                    <div className="p-3 bg-light border-bottom">
                        <Row className="g-2 align-items-end">
                            <Col xs="auto">
                                <Form.Label className="small fw-semibold mb-1"><FaCalendarAlt className="me-1" />De</Form.Label>
                                <Form.Control size="sm" type="date" value={dateDebut}
                                    onChange={e => setDateDebut(e.target.value)} style={{ maxWidth: 150 }} />
                            </Col>
                            <Col xs="auto">
                                <Form.Label className="small fw-semibold mb-1">Au</Form.Label>
                                <Form.Control size="sm" type="date" value={dateFin}
                                    onChange={e => setDateFin(e.target.value)} style={{ maxWidth: 150 }} />
                            </Col>
                            <Col xs="auto">
                                <Button size="sm" variant="primary" onClick={chargerAppros} disabled={loadingAppros}>
                                    {loadingAppros ? <Spinner animation="border" size="sm" /> : "🔍 Rechercher"}
                                </Button>
                            </Col>
                            {(dateDebut || dateFin) && (
                                <Col xs="auto">
                                    <Button size="sm" variant="outline-secondary"
                                        onClick={() => { setDateDebut(""); setDateFin(""); setAppros([]); }}>
                                        Réinit.
                                    </Button>
                                </Col>
                            )}
                        </Row>
                        {/* KPI totaux */}
                        {appros.length > 0 && (
                            <Row className="g-2 mt-2">
                                <Col>
                                    <Card body className="py-2 px-3 text-center border-0 bg-primary bg-opacity-10">
                                        <div className="small text-muted">Commandes</div>
                                        <div className="fw-bold fs-5">{totaux.nb}</div>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card body className="py-2 px-3 text-center border-0 bg-success bg-opacity-10">
                                        <div className="small text-muted">Total HT</div>
                                        <div className="fw-bold">{fmtN(totaux.ht)} FCFA</div>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card body className="py-2 px-3 text-center border-0 bg-warning bg-opacity-10">
                                        <div className="small text-muted">TVA</div>
                                        <div className="fw-bold">{fmtN(totaux.tva)} FCFA</div>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card body className="py-2 px-3 text-center border-0 bg-info bg-opacity-10">
                                        <div className="small text-muted">Total TTC</div>
                                        <div className="fw-bold text-info">{fmtN(totaux.montant)} FCFA</div>
                                    </Card>
                                </Col>
                            </Row>
                        )}
                    </div>

                    {/* Liste des approvisionnements */}
                    <div className="flex-grow-1 overflow-auto p-3">
                        {loadingAppros ? (
                            <div className="text-center py-5"><Spinner animation="border" /></div>
                        ) : appros.length === 0 ? (
                            <div className="text-center text-muted py-5">
                                {fournisseurDetail ? "Lancez une recherche pour afficher les achats." : ""}
                            </div>
                        ) : (
                            appros.map((a, idx) => {
                                const isOpen = expandedAppro === a._id;
                                return (
                                    <Card key={a._id ?? idx} className="mb-2 shadow-sm">
                                        <Card.Header
                                            className="d-flex justify-content-between align-items-center py-2 px-3"
                                            style={{ cursor: "pointer", background: isOpen ? "#e8f4fd" : undefined }}
                                            onClick={() => chargerLignes(a)}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="fw-semibold">{fmt(a.DateAppro)}</span>
                                                {a.NumeroFacture && (
                                                    <Badge bg="secondary" className="fw-normal">{a.NumeroFacture}</Badge>
                                                )}
                                                <span className="text-muted small">Saisi par : {a.SaisiPar || "—"}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="fw-bold text-success">{fmtN(a.MontantTTC || 0)} FCFA</span>
                                                <span className="text-muted" style={{ fontSize: 13 }}>{isOpen ? "▲" : "▼"}</span>
                                            </div>
                                        </Card.Header>

                                        {isOpen && (
                                            <Card.Body className="p-0">
                                                {a.loading ? (
                                                    <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                                                ) : !a.lignes || a.lignes.length === 0 ? (
                                                    <p className="text-muted text-center py-3 mb-0">Aucune ligne trouvée.</p>
                                                ) : (
                                                    <>
                                                        <Table bordered size="sm" className="mb-0 align-middle">
                                                            <thead style={{ background: "#1e3a5f", color: "#fff", fontSize: 11 }}>
                                                                <tr className="text-center">
                                                                    <th className="text-start ps-2">Médicament</th>
                                                                    <th>Réf.</th>
                                                                    <th>Qté</th>
                                                                    <th>P. Achat</th>
                                                                    <th>P. Vente</th>
                                                                    <th>Total HT</th>
                                                                    <th>TTC</th>
                                                                    <th>N° Lot</th>
                                                                    <th>Péremption</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody style={{ fontSize: 12 }}>
                                                                {a.lignes.map((l, li) => (
                                                                    <tr key={l._id ?? li}>
                                                                        <td className="ps-2 fw-semibold">{l.Medicament || "—"}</td>
                                                                        <td className="text-center">{l.Reference || "—"}</td>
                                                                        <td className="text-center fw-bold">{l.Quantite ?? 0}</td>
                                                                        <td className="text-end">{fmtN(l.PrixAchat || 0)}</td>
                                                                        <td className="text-end">{fmtN(l.PrixVente || 0)}</td>
                                                                        <td className="text-end">{fmtN(l.PRIXTHT || 0)}</td>
                                                                        <td className="text-end fw-bold">{fmtN(l.MontantTTCE || 0)}</td>
                                                                        <td className="text-center">{l.NumeroLot || "—"}</td>
                                                                        <td className="text-center">{l.DatePeremption ? fmt(l.DatePeremption) : "—"}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr style={{ background: "#f0f4f8", fontWeight: "bold", fontSize: 12 }}>
                                                                    <td colSpan={6} className="text-end pe-2">Sous-total</td>
                                                                    <td className="text-end text-success">
                                                                        {fmtN(a.lignes.reduce((s, l) => s + (l.MontantTTCE || 0), 0))} FCFA
                                                                    </td>
                                                                    <td colSpan={2}></td>
                                                                </tr>
                                                            </tfoot>
                                                        </Table>
                                                    </>
                                                )}
                                            </Card.Body>
                                        )}
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Modal Ajout / Edition */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error   && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
                                    <Form.Control name="Nom" value={form.Nom || ""} onChange={handleChange} size="sm" placeholder="Raison sociale" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Contact (personne)</Form.Label>
                                    <Form.Control name="Contact" value={form.Contact || ""} onChange={handleChange} size="sm" placeholder="Nom du contact" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Téléphone</Form.Label>
                                    <Form.Control name="Telephone" value={form.Telephone || ""} onChange={handleChange} size="sm" placeholder="+225 ..." />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control name="Email" type="email" value={form.Email || ""} onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>NIF / RCCM</Form.Label>
                                    <Form.Control name="NIF" value={form.NIF || ""} onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Adresse</Form.Label>
                                    <Form.Control name="Adresse" value={form.Adresse || ""} onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Ville</Form.Label>
                                    <Form.Control name="Ville" value={form.Ville || ""} onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                            <Col md={3} className="d-flex align-items-end">
                                <Form.Check
                                    type="switch"
                                    name="Actif"
                                    label="Actif"
                                    checked={form.Actif ?? true}
                                    onChange={handleChange}
                                    className="mb-1"
                                />
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Observations</Form.Label>
                                    <Form.Control name="Observations" as="textarea" rows={2} value={form.Observations || ""} onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Annuler</Button>
                        <Button variant="success" type="submit" disabled={saving}>
                            {saving ? "Enregistrement..." : editing ? "Modifier" : "Enregistrer"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
