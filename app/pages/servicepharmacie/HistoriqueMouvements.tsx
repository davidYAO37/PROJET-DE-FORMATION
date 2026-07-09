"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Table, Badge, Spinner, Button, InputGroup, Nav } from "react-bootstrap";
import { FaArrowDown, FaArrowUp, FaSearch, FaSync, FaList, FaCapsules } from "react-icons/fa";
import { usePagination } from "@/components/usePagination";
import Pagination from "@/components/Pagination";
import { Pharmacie } from "@/types/pharmacie";

interface Mouvement {
    _id: string;
    type: "ENTREE" | "SORTIE";
    date: string;
    reference: string;
    medicament: string;
    quantite: number;
    prixUnitaire: number;
    montantTotal: number;
    motif: string;
    saisiPar: string;
    numLot: string;
    datePeremption: string | null;
    observations: string;
}

// ===== Tableau réutilisable avec pagination =====
function TableMouvements({ mouvements, loading, emptyMsg, pageSize = 15 }: {
    mouvements: Mouvement[];
    loading: boolean;
    emptyMsg: string;
    pageSize?: number;
}) {
    const [ps, setPs] = useState(pageSize);
    const { slice, page, totalPages, setPage, reset } = usePagination(mouvements, ps);
    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

    // Reset page when data changes
    useEffect(() => { reset(); }, [mouvements.length]);

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /> Chargement...</div>;

    return (
        <div>
            <div className="table-responsive">
                <Table bordered hover size="sm" className="text-center align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Médicament</th>
                            <th>Référence</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Montant total</th>
                            <th>Motif</th>
                            <th>N° Lot</th>
                            <th>Péremption</th>
                            <th>Saisi par</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mouvements.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="text-muted py-4">{emptyMsg}</td>
                            </tr>
                        ) : (
                            slice.map((m, idx) => (
                                <tr key={m._id ?? idx} className={m.type === "ENTREE" ? "table-success bg-opacity-25" : "table-danger bg-opacity-25"}>
                                    <td>
                                        {m.type === "ENTREE"
                                            ? <Badge bg="success"><FaArrowDown /> Entrée</Badge>
                                            : <Badge bg="danger"><FaArrowUp /> Sortie</Badge>}
                                    </td>
                                    <td>{formatDate(m.date)}</td>
                                    <td className="text-start">{m.medicament || "—"}</td>
                                    <td>{m.reference || "—"}</td>
                                    <td className="fw-bold">
                                        {m.type === "ENTREE" ? "+" : "-"}{m.quantite ?? 0}
                                    </td>
                                    <td>{(m.prixUnitaire ?? 0).toLocaleString("fr-FR")}</td>
                                    <td>{(m.montantTotal ?? 0).toLocaleString("fr-FR")}</td>
                                    <td>{m.motif || "—"}</td>
                                    <td>{m.numLot || "—"}</td>
                                    <td>
                                        {m.datePeremption
                                            ? <span className="text-warning fw-semibold">{formatDate(m.datePeremption)}</span>
                                            : "—"}
                                    </td>
                                    <td>{m.saisiPar || "—"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={mouvements.length}
                pageSize={ps} onPage={setPage}
                onPageSize={n => { setPs(n); reset(); }} />
        </div>
    );
}

// ===== Onglet : Par médicament =====
function ParMedicament({ medicaments }: { medicaments: Pharmacie[] }) {
    const [selectedMedicament, setSelectedMedicament] = useState("");
    const [mouvements, setMouvements] = useState<Mouvement[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filtreType, setFiltreType] = useState<"TOUS" | "ENTREE" | "SORTIE">("TOUS");
    const [stockActuel, setStockActuel] = useState<any>(null);

    const chargerMouvements = useCallback(async () => {
        if (!selectedMedicament) return;
        setLoading(true);
        try {
            const med = medicaments.find(m => m._id === selectedMedicament);
            const ref = med?.Reference || "";
            const [mvtRes, stockRes] = await Promise.all([
                fetch(`/api/mouvementsstock?IDMEDICAMENT=${selectedMedicament}${ref ? `&reference=${encodeURIComponent(ref)}` : ""}`),
                fetch(`/api/stock?IDMEDICAMENT=${selectedMedicament}`),
            ]);
            const [mvtData, stockData] = await Promise.all([mvtRes.json(), stockRes.json()]);
            setMouvements(Array.isArray(mvtData) ? mvtData : []);
            setStockActuel(Array.isArray(stockData) && stockData.length > 0 ? stockData[0] : null);
        } catch (err) {
            console.error("Erreur chargement mouvements:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedMedicament, medicaments]);

    useEffect(() => { chargerMouvements(); }, [chargerMouvements]);

    const medicamentsFiltres = medicaments.filter(m =>
        m.Designation?.toLowerCase().includes(search.toLowerCase()) ||
        m.Reference?.toLowerCase().includes(search.toLowerCase())
    );

    const mouvementsFiltres = useMemo(() => mouvements.filter(m =>
        (filtreType === "TOUS" || m.type === filtreType)
    ), [mouvements, filtreType]);
    const totalEntrees = mouvements.filter(m => m.type === "ENTREE").reduce((acc, m) => acc + (m.quantite || 0), 0);
    const totalSorties = mouvements.filter(m => m.type === "SORTIE").reduce((acc, m) => acc + (m.quantite || 0), 0);

    return (
        <div>
            <div className="row g-2 mb-3 align-items-end">
                <div className="col-md-5">
                    <Form.Label className="fw-semibold small">Rechercher un médicament</Form.Label>
                    <InputGroup size="sm">
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Filtrer par désignation ou référence..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </InputGroup>
                </div>
                <div className="col-md-5">
                    <Form.Label className="fw-semibold small">Médicament</Form.Label>
                    <Form.Select size="sm" value={selectedMedicament} onChange={e => setSelectedMedicament(e.target.value)}>
                        <option value="">-- Sélectionner un médicament --</option>
                        {medicamentsFiltres.map(m => (
                            <option key={m._id} value={m._id}>
                                {m.Reference ? `[${m.Reference}] ` : ""}{m.Designation}
                            </option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-md-2">
                    <Button size="sm" variant="outline-primary" onClick={chargerMouvements} disabled={!selectedMedicament}>
                        <FaSync /> Actualiser
                    </Button>
                </div>
            </div>

            {stockActuel && (
                <div className="alert alert-info py-2 px-3 d-flex gap-4 align-items-center mb-3">
                    <span><strong>Stock physique :</strong> <Badge bg="primary">{stockActuel.QteEnStock ?? 0}</Badge></span>
                    <span><strong>Stock virtuel :</strong> <Badge bg="secondary">{stockActuel.QteStockVirtuel ?? 0}</Badge></span>
                    <span><strong>Seuil min :</strong> <Badge bg={((stockActuel.QteEnStock ?? 0) <= (stockActuel.QteMinimum ?? 0)) ? "danger" : "success"}>{stockActuel.QteMinimum ?? 0}</Badge></span>
                    <span className="ms-auto"><strong>Entrées :</strong> {totalEntrees} | <strong>Sorties :</strong> {totalSorties}</span>
                </div>
            )}

            <div className="d-flex gap-2 mb-3">
                {(["TOUS", "ENTREE", "SORTIE"] as const).map(t => (
                    <Button key={t} size="sm" variant={filtreType === t ? "primary" : "outline-secondary"} onClick={() => setFiltreType(t)}>
                        {t === "ENTREE" && <FaArrowDown className="me-1 text-success" />}
                        {t === "SORTIE" && <FaArrowUp className="me-1 text-danger" />}
                        {t}
                    </Button>
                ))}
                <span className="ms-auto text-muted small align-self-center">{mouvementsFiltres.length} mouvement(s)</span>
            </div>

            {!selectedMedicament ? (
                <div className="text-center text-muted py-5">Sélectionnez un médicament pour voir son historique.</div>
            ) : (
                <TableMouvements mouvements={mouvementsFiltres} loading={loading} emptyMsg="Aucun mouvement trouvé." />
            )}
        </div>
    );
}

// ===== Onglet : Tous les mouvements =====
function TousLesMouvements() {
    const [mouvements, setMouvements] = useState<Mouvement[]>([]);
    const [loading, setLoading] = useState(false);
    const [filtreType, setFiltreType] = useState<"TOUS" | "ENTREE" | "SORTIE">("TOUS");
    const [search, setSearch] = useState("");

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mouvementsstock");
            const data = await res.json();
            setMouvements(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erreur chargement tous mouvements:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { charger(); }, [charger]);

    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin]     = useState("");

    const filtres = useMemo(() => {
        const debut = dateDebut ? new Date(dateDebut).getTime() : 0;
        const fin   = dateFin   ? new Date(dateFin + "T23:59:59").getTime() : Infinity;
        return mouvements.filter(m => {
            const matchType = filtreType === "TOUS" || m.type === filtreType;
            const d = m.date ? new Date(m.date).getTime() : 0;
            const matchDate = d >= debut && d <= fin;
            const matchSearch = search.trim() === "" ? true :
                (m.medicament || "").toLowerCase().includes(search.toLowerCase()) ||
                (m.reference || "").toLowerCase().includes(search.toLowerCase()) ||
                (m.motif || "").toLowerCase().includes(search.toLowerCase()) ||
                (m.saisiPar || "").toLowerCase().includes(search.toLowerCase());
            return matchType && matchDate && matchSearch;
        });
    }, [mouvements, filtreType, search, dateDebut, dateFin]);

    const totalEntrees = mouvements.filter(m => m.type === "ENTREE").reduce((acc, m) => acc + (m.quantite || 0), 0);
    const totalSorties = mouvements.filter(m => m.type === "SORTIE").reduce((acc, m) => acc + (m.quantite || 0), 0);

    return (
        <div>
            <div className="d-flex gap-2 mb-3 align-items-end flex-wrap">
                <InputGroup size="sm" style={{ maxWidth: 280 }}>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder="Médicament, référence, motif..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </InputGroup>
                <Form.Control size="sm" type="date" value={dateDebut} style={{ maxWidth: 145 }}
                    onChange={e => setDateDebut(e.target.value)} />
                <Form.Control size="sm" type="date" value={dateFin} style={{ maxWidth: 145 }}
                    onChange={e => setDateFin(e.target.value)} />
                <div className="d-flex gap-2">
                    {(["TOUS", "ENTREE", "SORTIE"] as const).map(t => (
                        <Button key={t} size="sm" variant={filtreType === t ? "primary" : "outline-secondary"} onClick={() => setFiltreType(t)}>
                            {t === "ENTREE" && <FaArrowDown className="me-1 text-success" />}
                            {t === "SORTIE" && <FaArrowUp className="me-1 text-danger" />}
                            {t}
                        </Button>
                    ))}
                </div>
                <Button size="sm" variant="outline-secondary" onClick={charger} className="ms-auto">
                    <FaSync /> Actualiser
                </Button>
            </div>

            <div className="alert alert-secondary py-2 px-3 d-flex gap-4 mb-3">
                <span><strong>Total entrées :</strong> <Badge bg="success">{totalEntrees}</Badge></span>
                <span><strong>Total sorties :</strong> <Badge bg="danger">{totalSorties}</Badge></span>
                <span className="ms-auto text-muted small align-self-center">{filtres.length} mouvement(s) affiché(s) / {mouvements.length} total</span>
            </div>

            <TableMouvements mouvements={filtres} loading={loading} emptyMsg="Aucun mouvement en stock." />
        </div>
    );
}

// ===== Composant principal =====
export default function HistoriqueMouvements() {
    const [medicaments, setMedicaments] = useState<Pharmacie[]>([]);
    const [onglet, setOnglet] = useState("par-medicament");

    useEffect(() => {
        fetch("/api/medicaments")
            .then(r => r.json())
            .then(d => setMedicaments(Array.isArray(d) ? d : []))
            .catch(console.error);
    }, []);

    return (
        <div>
            <Nav variant="pills" className="mb-3" activeKey={onglet} onSelect={k => setOnglet(k || "par-medicament")}>
                <Nav.Item>
                    <Nav.Link eventKey="par-medicament" className="d-flex align-items-center gap-2">
                        <FaCapsules /> Par médicament
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="tous" className="d-flex align-items-center gap-2">
                        <FaList /> Tous les mouvements
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {onglet === "par-medicament" && <ParMedicament medicaments={medicaments} />}
            {onglet === "tous" && <TousLesMouvements />}
        </div>
    );
}
