"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Form, Table, Badge, Spinner, Button, Modal,
    InputGroup, Row, Col, Alert,
} from "react-bootstrap";
import { usePagination } from "@/components/usePagination";
import Pagination from "@/components/Pagination";
import {
    FaArrowDown, FaArrowUp, FaPlus, FaTrash, FaSearch, FaSync,
} from "react-icons/fa";
import { Pharmacie } from "@/types/pharmacie";

// ===== Types =====
type TypeMvt = "ENTREE" | "SORTIE";

const MOTIFS_ENTREE = [
    "Retour fournisseur",
    "Don / Donation",
    "Transfert entrant",
    "Ajustement inventaire",
    "Correction erreur",
    "Autre entrée",
];

const MOTIFS_SORTIE = [
    "Périmé / Destruction",
    "Perte / Casse",
    "Don interne",
    "Transfert sortant",
    "Usage interne",
    "Ajustement inventaire",
    "Correction erreur",
    "Autre sortie",
];

interface Mouvement {
    _id: string;
    type: TypeMvt;
    date: string;
    medicament: string;
    reference: string;
    quantite: number;
    prixUnitaire: number;
    motif: string;
    observations: string;
    saisiPar: string;
    numLot?: string;
    datePeremption?: string | null;
}

interface StockInfo {
    _id: string;
    QteEnStock: number;
    QteMinimum: number;
}

// ===== Formulaire =====
interface FormData {
    type: TypeMvt;
    IDMEDICAMENT: string;
    quantite: number;
    prixUnitaire: number;
    motif: string;
    observations: string;
    numeroLot: string;
    datePeremption: string;
}

const formDefaut: FormData = {
    type: "SORTIE",
    IDMEDICAMENT: "",
    quantite: 1,
    prixUnitaire: 0,
    motif: "",
    observations: "",
    numeroLot: "",
    datePeremption: "",
};

export default function MouvementsStock() {
    const [medicaments, setMedicaments] = useState<Pharmacie[]>([]);
    const [mouvements, setMouvements] = useState<Mouvement[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormData>(formDefaut);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchMed, setSearchMed] = useState("");
    const [filtreType, setFiltreType] = useState<"TOUS" | TypeMvt>("TOUS");
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    // Filtres tableau
    const [searchTable, setSearchTable] = useState("");
    const [dateDebut, setDateDebut]     = useState("");
    const [dateFin, setDateFin]         = useState("");
    const [pageSize, setPageSize]       = useState(15);

    useEffect(() => {
        fetch("/api/medicaments")
            .then(r => r.json())
            .then(d => setMedicaments(Array.isArray(d) ? d : []))
            .catch(console.error);
        charger();
    }, []);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mouvementsstock");
            const data = await res.json();
            // Garder uniquement les mouvements non-appro / non-vente
            const manuel = Array.isArray(data) ? data.filter((m: any) =>
                m.motif !== "Approvisionnement" && m.motif !== "Vente"
            ) : [];
            setMouvements(manuel);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleMedSelect = async (id: string) => {
        setForm(f => ({ ...f, IDMEDICAMENT: id }));
        if (!id) { setStockInfo(null); return; }
        try {
            const res = await fetch(`/api/stock?IDMEDICAMENT=${id}`);
            const data = await res.json();
            const s = Array.isArray(data) && data.length > 0 ? data[0] : null;
            setStockInfo(s ? { _id: s._id, QteEnStock: s.QteEnStock ?? 0, QteMinimum: s.QteMinimum ?? 0 } : null);
        } catch { setStockInfo(null); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        if (!form.IDMEDICAMENT) { setError("Sélectionnez un médicament."); return; }
        if (!form.motif) { setError("Sélectionnez un motif."); return; }
        if (form.quantite <= 0) { setError("La quantité doit être > 0."); return; }
        if (form.type === "SORTIE" && stockInfo && form.quantite > stockInfo.QteEnStock) {
            setError(`Stock insuffisant (disponible : ${stockInfo.QteEnStock}).`); return;
        }

        setSubmitting(true);
        const med = medicaments.find(m => m._id === form.IDMEDICAMENT);
        const utilisateur = localStorage.getItem("nom_utilisateur") || "Utilisateur";
        const now = new Date().toISOString();

        try {
            if (form.type === "SORTIE") {
                await fetch("/api/gestionstock/sortiestock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        DateSortie: now,
                        Reference: med?.Reference || "",
                        ArticleS: med?.Designation || "",
                        IDMEDICAMENT: form.IDMEDICAMENT,
                        Quantite: form.quantite,
                        Prix_unitaire: form.prixUnitaire,
                        Prix_TotalS: form.quantite * form.prixUnitaire,
                        Motif: form.motif,
                        TypeMouvement: form.motif,
                        Observations: form.observations,
                        SaisiPar: utilisateur,
                        SaisiLe: now,
                    }),
                });
            } else {
                await fetch("/api/gestionstock/entrestock/manuelle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        DateAppro: now,
                        Reference: med?.Reference || "",
                        Medicament: med?.Designation || "",
                        IDMEDICAMENT: form.IDMEDICAMENT,
                        Quantite: form.quantite,
                        PrixAchat: form.prixUnitaire,
                        PrixVente: med?.PrixVente || 0,
                        PRIXTHT: form.quantite * form.prixUnitaire,
                        MontantTTCE: form.quantite * form.prixUnitaire,
                        Motif: form.motif,
                        NumeroLot: form.numeroLot,
                        DatePeremption: form.datePeremption || null,
                        Observations: form.observations,
                        SaisiPar: utilisateur,
                        SaisiLe: now,
                    }),
                });
            }
            setSuccess(`${form.type === "SORTIE" ? "Sortie" : "Entrée"} enregistrée avec succès.`);
            setShowForm(false);
            setForm(formDefaut);
            setStockInfo(null);
            charger();
        } catch (err: any) {
            setError("Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (m: Mouvement) => {
        if (!confirm(`Supprimer ce mouvement (${m.medicament}, ${m.type === "SORTIE" ? "-" : "+"}${m.quantite}) ?`)) return;
        try {
            if (m.type === "SORTIE") {
                await fetch(`/api/gestionstock/sortiestock/${m._id}`, { method: "DELETE" });
            }
            charger();
        } catch { alert("Erreur lors de la suppression."); }
    };

    const medicamentsFiltres = medicaments.filter(m =>
        m.Designation?.toLowerCase().includes(searchMed.toLowerCase()) ||
        m.Reference?.toLowerCase().includes(searchMed.toLowerCase())
    );

    const mouvementsFiltres = useMemo(() => {
        const debut = dateDebut ? new Date(dateDebut).getTime() : 0;
        const fin   = dateFin   ? new Date(dateFin + "T23:59:59").getTime() : Infinity;
        return mouvements.filter(m => {
            const typeOk = filtreType === "TOUS" || m.type === filtreType;
            const d = m.date ? new Date(m.date).getTime() : 0;
            const dateOk = d >= debut && d <= fin;
            const txt = (m.medicament || "").toLowerCase().includes(searchTable.toLowerCase()) ||
                        (m.motif || "").toLowerCase().includes(searchTable.toLowerCase()) ||
                        (m.reference || "").toLowerCase().includes(searchTable.toLowerCase());
            return typeOk && dateOk && txt;
        });
    }, [mouvements, filtreType, dateDebut, dateFin, searchTable]);

    const { slice, page, totalPages, setPage, reset } = usePagination(mouvementsFiltres, pageSize);

    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
    const motifs = form.type === "SORTIE" ? MOTIFS_SORTIE : MOTIFS_ENTREE;

    return (
        <div>
            {/* Barre actions */}
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-end mb-3">
                <div className="d-flex flex-wrap gap-2 align-items-end">
                    {(["TOUS", "ENTREE", "SORTIE"] as const).map(t => (
                        <Button key={t} size="sm" variant={filtreType === t ? "primary" : "outline-secondary"}
                            onClick={() => { setFiltreType(t); reset(); }}>
                            {t === "ENTREE" && <FaArrowDown className="me-1 text-success" />}
                            {t === "SORTIE" && <FaArrowUp className="me-1 text-danger" />}
                            {t}
                        </Button>
                    ))}
                    <InputGroup size="sm" style={{ maxWidth: 220 }}>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control placeholder="Médicament, motif..." value={searchTable}
                            onChange={e => { setSearchTable(e.target.value); reset(); }} />
                    </InputGroup>
                    <Form.Control size="sm" type="date" value={dateDebut} style={{ maxWidth: 140 }}
                        onChange={e => { setDateDebut(e.target.value); reset(); }} />
                    <Form.Control size="sm" type="date" value={dateFin} style={{ maxWidth: 140 }}
                        onChange={e => { setDateFin(e.target.value); reset(); }} />
                    {(searchTable || dateDebut || dateFin) && (
                        <Button size="sm" variant="outline-secondary"
                            onClick={() => { setSearchTable(""); setDateDebut(""); setDateFin(""); reset(); }}>
                            ✕
                        </Button>
                    )}
                    <span className="text-muted small">{mouvementsFiltres.length} résultat(s)</span>
                </div>
                <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={charger}><FaSync /></Button>
                    <Button size="sm" variant="success" onClick={() => { setForm({ ...formDefaut, type: "ENTREE" }); setShowForm(true); }}>
                        <FaArrowDown className="me-1" /> Entrée
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => { setForm({ ...formDefaut, type: "SORTIE" }); setShowForm(true); }}>
                        <FaArrowUp className="me-1" /> Sortie
                    </Button>
                </div>
            </div>

            {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

            {/* Table */}
            {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /> Chargement...</div>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover size="sm" className="align-middle text-center">
                        <thead className="table-dark">
                            <tr>
                                <th>Type</th>
                                <th>Date</th>
                                <th className="text-start">Médicament</th>
                                <th>Quantité</th>
                                <th>Prix unit.</th>
                                <th>Total</th>
                                <th>Motif</th>
                                <th>Observations</th>
                                <th>Saisi par</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {mouvementsFiltres.length === 0 ? (
                                <tr><td colSpan={10} className="text-muted py-4">Aucun mouvement manuel enregistré.</td></tr>
                            ) : slice.map((m, idx) => (
                                <tr key={m._id ?? idx} className={m.type === "ENTREE" ? "table-success bg-opacity-25" : "table-danger bg-opacity-25"}>
                                    <td>
                                        {m.type === "ENTREE"
                                            ? <Badge bg="success"><FaArrowDown /> Entrée</Badge>
                                            : <Badge bg="danger"><FaArrowUp /> Sortie</Badge>}
                                    </td>
                                    <td>{formatDate(m.date)}</td>
                                    <td className="text-start fw-semibold">{m.medicament || "—"}</td>
                                    <td className="fw-bold">{m.type === "ENTREE" ? "+" : "-"}{m.quantite ?? 0}</td>
                                    <td>{(m.prixUnitaire ?? 0).toLocaleString("fr-FR")}</td>
                                    <td>{((m.quantite ?? 0) * (m.prixUnitaire ?? 0)).toLocaleString("fr-FR")}</td>
                                    <td><Badge bg="secondary">{m.motif || "—"}</Badge></td>
                                    <td className="text-start" style={{ maxWidth: 180, fontSize: 12 }}>{m.observations || "—"}</td>
                                    <td>{m.saisiPar || "—"}</td>
                                    <td>
                                        {m.type === "SORTIE" && (
                                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(m)} title="Supprimer">
                                                <FaTrash />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination page={page} totalPages={totalPages} total={mouvementsFiltres.length}
                        pageSize={pageSize} onPage={setPage}
                        onPageSize={n => { setPageSize(n); reset(); }} />
                </div>
            )}

            {/* Modal saisie */}
            <Modal show={showForm} onHide={() => setShowForm(false)} centered size="lg">
                <Modal.Header closeButton className={form.type === "SORTIE" ? "bg-danger text-white" : "bg-success text-white"}>
                    <Modal.Title>
                        {form.type === "SORTIE"
                            ? <><FaArrowUp className="me-2" />Nouvelle sortie de stock</>
                            : <><FaArrowDown className="me-2" />Nouvelle entrée de stock</>}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}

                        <Row className="g-3">
                            {/* Type */}
                            <Col md={12}>
                                <div className="d-flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={form.type === "SORTIE" ? "danger" : "outline-danger"}
                                        onClick={() => setForm(f => ({ ...f, type: "SORTIE", motif: "" }))}
                                    >
                                        <FaArrowUp className="me-1" /> Sortie
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={form.type === "ENTREE" ? "success" : "outline-success"}
                                        onClick={() => setForm(f => ({ ...f, type: "ENTREE", motif: "" }))}
                                    >
                                        <FaArrowDown className="me-1" /> Entrée
                                    </Button>
                                </div>
                            </Col>

                            {/* Médicament */}
                            <Col md={12}>
                                <Form.Label className="fw-semibold">Médicament *</Form.Label>
                                <InputGroup size="sm">
                                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Filtrer..."
                                        value={searchMed}
                                        onChange={e => setSearchMed(e.target.value)}
                                        style={{ maxWidth: 200 }}
                                    />
                                </InputGroup>
                                <Form.Select
                                    size="sm"
                                    className="mt-1"
                                    value={form.IDMEDICAMENT}
                                    onChange={e => handleMedSelect(e.target.value)}
                                    required
                                >
                                    <option value="">-- Sélectionner --</option>
                                    {medicamentsFiltres.map(m => (
                                        <option key={m._id} value={m._id}>
                                            {m.Reference ? `[${m.Reference}] ` : ""}{m.Designation}
                                        </option>
                                    ))}
                                </Form.Select>
                                {stockInfo && (
                                    <div className="mt-1 d-flex gap-3 small">
                                        <span>Stock actuel : <Badge bg={stockInfo.QteEnStock <= 0 ? "danger" : stockInfo.QteEnStock <= stockInfo.QteMinimum ? "warning" : "success"}>{stockInfo.QteEnStock}</Badge></span>
                                        <span>Seuil min : <Badge bg="secondary">{stockInfo.QteMinimum}</Badge></span>
                                    </div>
                                )}
                            </Col>

                            {/* Motif */}
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Motif *</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={form.motif}
                                    onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
                                    required
                                >
                                    <option value="">-- Sélectionner --</option>
                                    {motifs.map(m => <option key={m} value={m}>{m}</option>)}
                                </Form.Select>
                            </Col>

                            {/* Quantité */}
                            <Col md={3}>
                                <Form.Label className="fw-semibold">Quantité *</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min={1}
                                    value={form.quantite}
                                    onChange={e => setForm(f => ({ ...f, quantite: Number(e.target.value) || 1 }))}
                                    required
                                />
                            </Col>

                            {/* Prix */}
                            <Col md={3}>
                                <Form.Label className="fw-semibold">Prix unitaire</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min={0}
                                    value={form.prixUnitaire}
                                    onChange={e => setForm(f => ({ ...f, prixUnitaire: Number(e.target.value) || 0 }))}
                                />
                            </Col>

                            {/* Champs entrée uniquement */}
                            {form.type === "ENTREE" && (
                                <>
                                    <Col md={6}>
                                        <Form.Label className="fw-semibold">N° Lot</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="text"
                                            placeholder="Ex: LOT-001"
                                            value={form.numeroLot}
                                            onChange={e => setForm(f => ({ ...f, numeroLot: e.target.value }))}
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="fw-semibold">Date péremption</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="date"
                                            value={form.datePeremption}
                                            onChange={e => setForm(f => ({ ...f, datePeremption: e.target.value }))}
                                        />
                                    </Col>
                                </>
                            )}

                            {/* Observations */}
                            <Col md={12}>
                                <Form.Label className="fw-semibold">Observations</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    size="sm"
                                    value={form.observations}
                                    onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
                                    placeholder="Remarques éventuelles..."
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowForm(false)} disabled={submitting}>Annuler</Button>
                        <Button
                            type="submit"
                            variant={form.type === "SORTIE" ? "danger" : "success"}
                            disabled={submitting}
                        >
                            {submitting ? "Enregistrement..." : `Enregistrer la ${form.type === "SORTIE" ? "sortie" : "entrée"}`}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
