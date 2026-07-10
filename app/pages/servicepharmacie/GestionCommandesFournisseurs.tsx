"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert, Badge, Button, Col, Dropdown, Form, InputGroup, Modal, Row, Spinner, Table,
} from "react-bootstrap";
import {
    FaCheck, FaEye, FaPaperPlane, FaPencilAlt, FaPlus, FaPrint, FaSearch, FaTimes, FaTruck,
} from "react-icons/fa";
import { usePagination } from "@/components/usePagination";
import Pagination from "@/components/Pagination";
import { CommandeFournisseur, LigneCommande, StatutCommande } from "@/types/CommandeFournisseur";
import { Pharmacie } from "@/types/pharmacie";
import { useEntreprise } from "@/hooks/useEntreprise";
import {
    generatePrintHeader,
    generatePrintFooter,
    createPrintWindow,
    createPrintWindowWithoutHeader,
} from "@/utils/printRecu";

interface Fournisseur {
    _id?: string;
    Nom?: string;
    Telephone?: string;
    Ville?: string;
}

interface LigneForm extends LigneCommande {
    key: string;
}

interface ReceptionLigneForm {
    ligneId: string;
    QteRecue: number;
    PrixAchat: number;
    PrixVente: number;
    TVA: number;
    NumeroLot: string;
    DatePeremption: string;
    QteMinimum: number;
    QteMaximum: number;
    Reference?: string;
    Medicament?: string;
    QteCommandee?: number;
    QteDejaRecue?: number;
}

const STATUT_LABELS: Record<StatutCommande, { label: string; variant: string }> = {
    BROUILLON:           { label: "Brouillon",            variant: "secondary" },
    ENVOYEE:             { label: "Envoyée",              variant: "info"      },
    RECEPTION_PARTIELLE: { label: "Réception partielle",  variant: "warning"   },
    SOLDEE:              { label: "Soldée",               variant: "success"   },
    ANNULEE:             { label: "Annulée",              variant: "danger"    },
};

const formatDate = (d: any) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const formatNumber = (n: any) => (n ?? 0).toLocaleString("fr-FR");
const todayInput = () => new Date().toISOString().slice(0, 10);

const buildBonCommandeHTML = (commande: CommandeFournisseur): string => {
    const lignes = (commande.lignes || []).map((l, i) => {
        const totalLigne = l.TotalTTC ?? (l.QteCommandee * (l.PrixAchat || 0) + (l.TVA || 0));
        return `
        <tr>
            <td style="border:1px solid #000;padding:6px;text-align:center">${i + 1}</td>
            <td style="border:1px solid #000;padding:6px;text-align:left">${l.Medicament || "—"}<br><span style="font-size:11px;color:#555">${l.Reference || ""}</span></td>
            <td style="border:1px solid #000;padding:6px;text-align:center">${l.QteCommandee}</td>
            <td style="border:1px solid #000;padding:6px;text-align:right">${formatNumber(l.PrixAchat)}</td>
            <td style="border:1px solid #000;padding:6px;text-align:center">${l.TVA ? formatNumber(l.TVA) : "—"}</td>
            <td style="border:1px solid #000;padding:6px;text-align:right">${formatNumber(totalLigne)}</td>
        </tr>
    `;
    }).join("");

    const totalTTC = commande.MontantTTC || (commande.lignes || []).reduce((s, l) => s + (l.TotalTTC ?? (l.QteCommandee * (l.PrixAchat || 0) + (l.TVA || 0))), 0);

    return `
        <div class="print-area">
            <div class="sub-header">BON DE COMMANDE FOURNISSEUR</div>
            <div class="d-flex justify-content-between" style="margin-bottom:20px">
                <div class="info">
                    <div><strong>N° commande :</strong> ${commande.NumeroCommande || "—"}</div>
                    <div><strong>Date :</strong> ${formatDate(commande.DateCommande)}</div>
                    <div><strong>Livraison prévue :</strong> ${formatDate(commande.DateLivraisonPrevue)}</div>
                </div>
                <div class="info">
                    <div><strong>Fournisseur :</strong> ${commande.NomFournisseur || "—"}</div>
                    <div><strong>Statut :</strong> ${STATUT_LABELS[commande.Statut || "BROUILLON"].label}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="border:1px solid #000;padding:6px;background:#f0f0f0">N°</th>
                        <th style="border:1px solid #000;padding:6px;background:#f0f0f0">Médicament</th>
                        <th style="border:1px solid #000;padding:6px;background:#f0f0f0">Qté</th>
                        <th style="border:1px solid #000;padding:6px;background:#f0f0f0">Prix achat</th>
                        <th style="border:1px solid #000;padding:6px;background:#f0f0f0">TVA</th>
                        <th style="border:1px solid #000;padding:6px;background:#f0f0f0">Total TTC</th>
                    </tr>
                </thead>
                <tbody>
                    ${lignes || `<tr><td colspan="6" style="border:1px solid #000;padding:6px;text-align:center">Aucune ligne</td></tr>`}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold">TOTAL TTC</td>
                        <td style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold">${formatNumber(totalTTC)} FCFA</td>
                    </tr>
                </tfoot>
            </table>
            <div class="mt-3">
                <strong>Observations :</strong> ${commande.Observations || "—"}
            </div>
            <div class="mt-4 d-flex justify-content-between">
                <div><strong>Saisi par :</strong> ${commande.SaisiPar || "—"}</div>
                <div><strong>Date d'édition :</strong> ${formatDate(new Date())}</div>
            </div>
            <div class="mt-4" style="text-align:center;font-size:12px">
                <em>Ce bon de commande est généré par le système EasyMedical.</em>
            </div>
        </div>
    `;
};

export default function GestionCommandesFournisseurs() {
    const [commandes, setCommandes] = useState<CommandeFournisseur[]>([]);
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [medicaments, setMedicaments] = useState<Pharmacie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { entreprise } = useEntreprise();

    const [search, setSearch] = useState("");
    const [statutFilter, setStatutFilter] = useState<StatutCommande | "EN_COURS" | "">("EN_COURS");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");
    const [pageSize, setPageSize] = useState(15);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<CommandeFournisseur | null>(null);

    const [showReception, setShowReception] = useState(false);
    const [receptionCommande, setReceptionCommande] = useState<CommandeFournisseur | null>(null);

    const [showDetail, setShowDetail] = useState(false);
    const [detailCommande, setDetailCommande] = useState<CommandeFournisseur | null>(null);

    const [showCancel, setShowCancel] = useState(false);
    const [cancelCommande, setCancelCommande] = useState<CommandeFournisseur | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [cmdRes, fourRes, medRes] = await Promise.all([
                fetch("/api/commande-fournisseur"),
                fetch("/api/fournisseur?actif=true"),
                fetch("/api/medicaments"),
            ]);
            const commandesData = cmdRes.ok ? await cmdRes.json() : [];
            const fournisseursData = fourRes.ok ? await fourRes.json() : [];
            const medicamentsData = medRes.ok ? await medRes.json() : [];
            setCommandes(Array.isArray(commandesData) ? commandesData : []);
            setFournisseurs(Array.isArray(fournisseursData) ? fournisseursData : []);
            setMedicaments(Array.isArray(medicamentsData) ? medicamentsData : []);
        } catch (err: any) {
            setError(err.message || "Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    const filteredCommandes = useMemo(() => {
        const debut = dateDebut ? new Date(dateDebut).getTime() : 0;
        const fin = dateFin ? new Date(dateFin + "T23:59:59").getTime() : Infinity;
        return commandes.filter((c) => {
            const txt =
                (c.NumeroCommande || "").toLowerCase().includes(search.toLowerCase()) ||
                (c.NomFournisseur || "").toLowerCase().includes(search.toLowerCase()) ||
                (c.Observations || "").toLowerCase().includes(search.toLowerCase());
            const d = c.DateCommande ? new Date(c.DateCommande).getTime() : 0;
            let statutOk = true;
            if (statutFilter === "EN_COURS") {
                statutOk = c.Statut === "BROUILLON" || c.Statut === "ENVOYEE" || c.Statut === "RECEPTION_PARTIELLE";
            } else if (statutFilter) {
                statutOk = c.Statut === statutFilter;
            }
            return txt && d >= debut && d <= fin && statutOk;
        });
    }, [commandes, search, statutFilter, dateDebut, dateFin]);

    const { slice, page, totalPages, setPage, reset, total } = usePagination(filteredCommandes, pageSize);

    const resetFilters = () => {
        setSearch("");
        setStatutFilter("EN_COURS");
        setDateDebut("");
        setDateFin("");
        reset();
    };

    const handleCreate = () => {
        setEditing(null);
        setShowForm(true);
    };

    const imprimerAvecEntete = (c: CommandeFournisseur) => {
        const titre = `Bon de commande ${c.NumeroCommande || ""}`;
        createPrintWindow(titre, generatePrintHeader(entreprise), buildBonCommandeHTML(c), generatePrintFooter(entreprise));
    };

    const imprimerSansEntete = (c: CommandeFournisseur) => {
        const titre = `Bon de commande ${c.NumeroCommande || ""}`;
        createPrintWindowWithoutHeader(titre, buildBonCommandeHTML(c));
    };

    const handleEdit = (c: CommandeFournisseur) => {
        setEditing(c);
        setShowForm(true);
    };

    const handleSend = async (c: CommandeFournisseur) => {
        if (!window.confirm(`Envoyer la commande ${c.NumeroCommande} au fournisseur ?`)) return;
        try {
            const res = await fetch(`/api/commande-fournisseur/${c._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Statut: "ENVOYEE" }),
            });
            if (!res.ok) throw new Error("Erreur lors de l'envoi");
            await loadData();
        } catch (err: any) {
            setError(err.message || "Erreur d'envoi");
        }
    };

    const handleReceive = (c: CommandeFournisseur) => {
        setReceptionCommande(c);
        setShowReception(true);
    };

    const handleCancelClick = (c: CommandeFournisseur) => {
        setCancelCommande(c);
        setShowCancel(true);
    };

    const handleCancelConfirm = async () => {
        if (!cancelCommande) return;
        try {
            const res = await fetch(`/api/commande-fournisseur/${cancelCommande._id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erreur lors de l'annulation");
            setShowCancel(false);
            setCancelCommande(null);
            await loadData();
        } catch (err: any) {
            setError(err.message || "Erreur d'annulation");
        }
    };

    const handleView = (c: CommandeFournisseur) => {
        setDetailCommande(c);
        setShowDetail(true);
    };

    const isEditable = (c: CommandeFournisseur) => c.Statut === "BROUILLON";
    const isSendable = (c: CommandeFournisseur) => c.Statut === "BROUILLON";
    const isReceivable = (c: CommandeFournisseur) => c.Statut === "ENVOYEE" || c.Statut === "RECEPTION_PARTIELLE";
    const isCancelable = (c: CommandeFournisseur) => c.Statut !== "SOLDEE" && c.Statut !== "ANNULEE";

    return (
        <>
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                <h5 className="mb-0 fw-bold">Commandes fournisseurs</h5>
                <Button variant="success" size="sm" onClick={handleCreate}>
                    <FaPlus className="me-1" /> Nouvelle commande
                </Button>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-end">
                <InputGroup size="sm" style={{ maxWidth: 260 }}>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                        placeholder="N° commande, fournisseur..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); reset(); }}
                    />
                </InputGroup>
                <Form.Select size="sm" style={{ maxWidth: 180 }}
                    value={statutFilter}
                    onChange={(e) => { setStatutFilter(e.target.value as any); reset(); }}
                >
                    <option value="EN_COURS">En cours</option>
                    <option value="">Tous les statuts</option>
                    <option value="BROUILLON">Brouillon</option>
                    <option value="ENVOYEE">Envoyée</option>
                    <option value="RECEPTION_PARTIELLE">Réception partielle</option>
                    <option value="SOLDEE">Soldée</option>
                    <option value="ANNULEE">Annulée</option>
                </Form.Select>
                <div className="d-flex gap-1 align-items-center">
                    <Form.Control size="sm" type="date" value={dateDebut}
                        onChange={(e) => { setDateDebut(e.target.value); reset(); }}
                        style={{ maxWidth: 150 }} />
                    <span className="text-muted small">→</span>
                    <Form.Control size="sm" type="date" value={dateFin}
                        onChange={(e) => { setDateFin(e.target.value); reset(); }}
                        style={{ maxWidth: 150 }} />
                </div>
                {(search || statutFilter !== "EN_COURS" || dateDebut || dateFin) && (
                    <Button size="sm" variant="outline-secondary" onClick={resetFilters}>
                        Réinitialiser
                    </Button>
                )}
                <span className="text-muted small ms-auto">{filteredCommandes.length} résultat(s)</span>
            </div>

            {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /> Chargement...</div>
            ) : filteredCommandes.length === 0 ? (
                <div className="text-center text-muted py-4">Aucune commande trouvée.</div>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover size="sm" className="align-middle">
                        <thead className="table-dark text-center">
                            <tr>
                                <th>N° Commande</th>
                                <th>Date</th>
                                <th>Fournisseur</th>
                                <th>Statut</th>
                                <th>Total TTC</th>
                                <th>Saisi par</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {slice.map((c, idx) => (
                                <tr key={c._id ?? idx} className="text-center">
                                    <td className="fw-semibold">{c.NumeroCommande || "—"}</td>
                                    <td>{formatDate(c.DateCommande)}</td>
                                    <td className="text-start">{c.NomFournisseur || "—"}</td>
                                    <td>
                                        <Badge bg={STATUT_LABELS[c.Statut || "BROUILLON"].variant}>
                                            {STATUT_LABELS[c.Statut || "BROUILLON"].label}
                                        </Badge>
                                    </td>
                                    <td className="fw-bold">{formatNumber(c.MontantTTC)} FCFA</td>
                                    <td>{c.SaisiPar || "—"}</td>
                                    <td>
                                        <div className="d-flex gap-1 justify-content-center">
                                            <Button size="sm" variant="outline-info" onClick={() => handleView(c)} title="Voir le détail">
                                                <FaEye />
                                            </Button>
                                            <Dropdown>
                                                <Dropdown.Toggle size="sm" variant="outline-secondary" title="Imprimer le bon de commande">
                                                    <FaPrint />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item onClick={() => imprimerAvecEntete(c)}>Imprimer avec entête</Dropdown.Item>
                                                    <Dropdown.Item onClick={() => imprimerSansEntete(c)}>Imprimer sans entête</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                            {isEditable(c) && (
                                                <Button size="sm" variant="outline-primary" onClick={() => handleEdit(c)} title="Modifier">
                                                    <FaPencilAlt />
                                                </Button>
                                            )}
                                            {isSendable(c) && (
                                                <Button size="sm" variant="outline-success" onClick={() => handleSend(c)} title="Envoyer au fournisseur">
                                                    <FaPaperPlane />
                                                </Button>
                                            )}
                                            {isReceivable(c) && (
                                                <Button size="sm" variant="outline-warning" onClick={() => handleReceive(c)} title="Réceptionner">
                                                    <FaTruck />
                                                </Button>
                                            )}
                                            {isCancelable(c) && (
                                                <Button size="sm" variant="outline-danger" onClick={() => handleCancelClick(c)} title="Annuler">
                                                    <FaTimes />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination
                        page={page} totalPages={totalPages} total={total} pageSize={pageSize}
                        onPage={setPage}
                        onPageSize={(n) => { setPageSize(n); reset(); }}
                    />
                </div>
            )}

            <CommandeFormModal
                show={showForm}
                onHide={() => setShowForm(false)}
                commande={editing}
                fournisseurs={fournisseurs}
                medicaments={medicaments}
                onSaved={loadData}
                setError={setError}
            />

            <ReceptionModal
                show={showReception}
                onHide={() => { setShowReception(false); setReceptionCommande(null); }}
                commande={receptionCommande}
                onSaved={loadData}
                setError={setError}
            />

            <DetailModal
                show={showDetail}
                onHide={() => { setShowDetail(false); setDetailCommande(null); }}
                commande={detailCommande}
                onPrintWithHeader={imprimerAvecEntete}
                onPrintWithoutHeader={imprimerSansEntete}
            />

            <Modal show={showCancel} onHide={() => setShowCancel(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Annuler la commande</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Confirmer l'annulation de la commande <strong>{cancelCommande?.NumeroCommande}</strong> ?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowCancel(false)}>Retour</Button>
                    <Button variant="danger" size="sm" onClick={handleCancelConfirm}>Annuler la commande</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Modal création / modification                                      */
/* ------------------------------------------------------------------ */

function CommandeFormModal({
    show,
    onHide,
    commande,
    fournisseurs,
    medicaments,
    onSaved,
    setError,
}: {
    show: boolean;
    onHide: () => void;
    commande: CommandeFournisseur | null;
    fournisseurs: Fournisseur[];
    medicaments: Pharmacie[];
    onSaved: () => void;
    setError: (msg: string) => void;
}) {
    const [idFournisseur, setIdFournisseur] = useState("");
    const [dateCommande, setDateCommande] = useState(todayInput());
    const [dateLivraison, setDateLivraison] = useState("");
    const [observations, setObservations] = useState("");
    const [lignes, setLignes] = useState<LigneForm[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && commande) {
            setIdFournisseur(commande.IDFournisseur?.toString() || "");
            setDateCommande(commande.DateCommande ? new Date(commande.DateCommande).toISOString().slice(0, 10) : todayInput());
            setDateLivraison(commande.DateLivraisonPrevue ? new Date(commande.DateLivraisonPrevue).toISOString().slice(0, 10) : "");
            setObservations(commande.Observations || "");
            setLignes((commande.lignes || []).map((l) => ({ ...l, key: l._id || `l-${Date.now()}-${Math.random()}` })));
        } else if (show) {
            setIdFournisseur("");
            setDateCommande(todayInput());
            setDateLivraison("");
            setObservations("");
            setLignes([]);
        }
    }, [show, commande]);

    const addLigne = () => {
        setLignes((prev) => [
            ...prev,
            {
                key: `new-${Date.now()}-${Math.random()}`,
                IDMEDICAMENT: "",
                Medicament: "",
                Reference: "",
                TypeArticle: "PHARMACIE",
                QteCommandee: 1,
                QteRecue: 0,
                PrixAchat: 0,
                PrixVente: 0,
                TVA: 0,
                TotalHT: 0,
                TotalTTC: 0,
            },
        ]);
    };

    const updateLigne = (key: string, updates: Partial<LigneForm>) => {
        setLignes((prev) =>
            prev.map((l) => {
                if (l.key !== key) return l;
                const merged = { ...l, ...updates };
                const totalHT = (merged.QteCommandee || 0) * (merged.PrixAchat || 0);
                merged.TotalHT = totalHT;
                merged.TotalTTC = totalHT + (merged.TVA || 0);
                return merged;
            })
        );
    };

    const removeLigne = (key: string) => {
        setLignes((prev) => prev.filter((l) => l.key !== key));
    };

    const totals = useMemo(() => {
        const prixHT = lignes.reduce((s, l) => s + (l.TotalHT || 0), 0);
        const totalTVA = lignes.reduce((s, l) => s + (l.TVA || 0), 0);
        const montantTTC = lignes.reduce((s, l) => s + (l.TotalTTC || 0), 0);
        return { prixHT, totalTVA, montantTTC };
    }, [lignes]);

    const buildPayload = (statut: StatutCommande) => {
        const fournisseur = fournisseurs.find((f) => f._id === idFournisseur);
        const utilisateur = localStorage.getItem("nom_utilisateur") || "Utilisateur";
        const lignesPayload = lignes.map((l) => ({
            _id: l._id,
            IDMEDICAMENT: l.IDMEDICAMENT,
            Medicament: l.Medicament,
            Reference: l.Reference,
            TypeArticle: l.TypeArticle || "PHARMACIE",
            QteCommandee: l.QteCommandee,
            QteRecue: l.QteRecue || 0,
            PrixAchat: l.PrixAchat || 0,
            PrixVente: l.PrixVente || 0,
            TVA: l.TVA || 0,
            TotalHT: l.TotalHT || 0,
            TotalTTC: l.TotalTTC || 0,
        }));
        return {
            DateCommande: new Date(dateCommande).toISOString(),
            DateLivraisonPrevue: dateLivraison ? new Date(dateLivraison).toISOString() : null,
            IDFournisseur: idFournisseur || null,
            NomFournisseur: fournisseur?.Nom || "",
            Observations: observations,
            SaisiPar: utilisateur,
            SaisiLe: new Date().toISOString(),
            Statut: statut,
            PrixHT: totals.prixHT,
            TotalTVA: totals.totalTVA,
            MontantTTC: totals.montantTTC,
            lignes: lignesPayload,
        };
    };

    const save = async (statut: StatutCommande) => {
        if (!idFournisseur) {
            setError("Veuillez sélectionner un fournisseur.");
            return;
        }
        if (lignes.length === 0) {
            setError("Veuillez ajouter au moins une ligne.");
            return;
        }
        if (lignes.some((l) => !l.IDMEDICAMENT || l.QteCommandee <= 0)) {
            setError("Veuillez renseigner le médicament et la quantité pour chaque ligne.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const payload = buildPayload(statut);
            const url = commande?._id ? `/api/commande-fournisseur/${commande._id}` : "/api/commande-fournisseur";
            const method = commande?._id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Erreur d'enregistrement");
            }
            onSaved();
            onHide();
        } catch (err: any) {
            setError(err.message || "Erreur d'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>{commande ? "Modifier la commande" : "Nouvelle commande"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="g-2 mb-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Fournisseur</Form.Label>
                            <Form.Select size="sm" value={idFournisseur} onChange={(e) => setIdFournisseur(e.target.value)}>
                                <option value="">— Sélectionner —</option>
                                {fournisseurs.map((f) => (
                                    <option key={f._id} value={f._id}>{f.Nom}{f.Ville ? ` — ${f.Ville}` : ""}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Date commande</Form.Label>
                            <Form.Control size="sm" type="date" value={dateCommande} onChange={(e) => setDateCommande(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Livraison prévue</Form.Label>
                            <Form.Control size="sm" type="date" value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                        <Button size="sm" variant="primary" onClick={addLigne}>
                            <FaPlus className="me-1" /> Ligne
                        </Button>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Observations</Form.Label>
                            <Form.Control size="sm" as="textarea" rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>

                <div className="table-responsive" style={{ maxHeight: "50vh", overflow: "auto" }}>
                    <Table bordered hover size="sm" className="mb-0">
                        <thead className="table-light sticky-top">
                            <tr className="text-center">
                                <th>Médicament</th>
                                <th>Type</th>
                                <th>Référence</th>
                                <th>Qté</th>
                                <th>Prix achat</th>
                                <th>TVA</th>
                                <th>Total TTC</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lignes.map((ligne) => (
                                <LigneFormRow
                                    key={ligne.key}
                                    ligne={ligne}
                                    medicaments={medicaments}
                                    onChange={(updates) => updateLigne(ligne.key, updates)}
                                    onRemove={() => removeLigne(ligne.key)}
                                />
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="table-secondary">
                                <td colSpan={5} className="text-end fw-bold">Total TTC</td>
                                <td className="fw-bold">{totals.montantTTC.toLocaleString("fr-FR")}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
                {lignes.length === 0 && (
                    <div className="text-center text-muted py-3">Aucune ligne. Cliquez sur "+ Ligne" pour commencer.</div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={onHide} disabled={loading}>Fermer</Button>
                <Button variant="outline-primary" size="sm" onClick={() => save("BROUILLON")} disabled={loading}>
                    {loading ? "Enregistrement..." : "Enregistrer brouillon"}
                </Button>
                <Button variant="success" size="sm" onClick={() => save("ENVOYEE")} disabled={loading}>
                    <FaPaperPlane className="me-1" /> {loading ? "Envoi..." : "Enregistrer et envoyer"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

interface SearchableMedicamentSelectProps {
    medicaments: Pharmacie[];
    selectedId: string;
    onSelect: (medicamentId: string) => void;
}

function SearchableMedicamentSelect({ medicaments, selectedId, onSelect }: SearchableMedicamentSelectProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const selectedMedicament = medicaments.find((m) => m._id === selectedId);
    const displayValue = selectedMedicament ? selectedMedicament.Designation || "" : "";

    const allFilteredMedicaments = searchTerm
        ? medicaments.filter(
              (m) =>
                  (m.Designation || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (m.Reference || "").toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : medicaments;

    const filteredMedicaments = allFilteredMedicaments.slice(0, 50);

    useEffect(() => {
        if (showDropdown && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 5,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [showDropdown]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
                setSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (medicamentId: string) => {
        onSelect(medicamentId);
        setSearchTerm("");
        setShowDropdown(false);
    };

    return (
        <div style={{ position: "relative" }}>
            <Form.Control
                ref={inputRef}
                type="text"
                size="sm"
                placeholder="Rechercher un médicament..."
                value={showDropdown ? searchTerm : displayValue}
                onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                style={{ fontSize: "13px" }}
            />
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: "fixed",
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                        maxHeight: "200px",
                        overflow: "auto",
                        backgroundColor: "white",
                        border: "1px solid #dee2e6",
                        borderRadius: "0.375rem",
                        boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                        zIndex: 1000,
                    }}
                >
                    {searchTerm && (
                        <div style={{ padding: "4px 8px", fontSize: "11px", color: "#6c757d", borderBottom: "1px solid #f8f9fa", backgroundColor: "#f8f9fa" }}>
                            {allFilteredMedicaments.length} résultat{allFilteredMedicaments.length > 1 ? "s" : ""} trouvé{allFilteredMedicaments.length > 1 ? "s" : ""}
                        </div>
                    )}
                    {filteredMedicaments.length === 0 ? (
                        <div style={{ padding: "8px", color: "#6c757d", fontSize: "13px", textAlign: "center" }}>
                            Aucun médicament trouvé
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {filteredMedicaments.map((medicament) => (
                                <div
                                    key={medicament._id || `medicament-${medicament.Reference}`}
                                    onClick={() => handleSelect(medicament._id || "")}
                                    style={{
                                        padding: "8px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        borderBottom: "1px solid #f8f9fa",
                                        backgroundColor: medicament._id === selectedId ? "#e3f2fd" : "white",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8f9fa"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = medicament._id === selectedId ? "#e3f2fd" : "white"; }}
                                >
                                    <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{medicament.Designation}</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "11px", alignItems: "center" }}>
                                        {medicament.Reference && <span style={{ color: "#6c757d" }}> {medicament.Reference}</span>}
                                        {medicament.PrixAchat && <span style={{ color: "#0d6efd" }}>💰 Achat: {medicament.PrixAchat} FCFA</span>}
                                        {medicament.PrixVente && <span style={{ color: "#198754" }}>🏥 Vente: {medicament.PrixVente} FCFA</span>}
                                        <Badge bg={medicament.TypeArticle === "LABORATOIRE" ? "warning" : "info"} className="text-uppercase" style={{ fontSize: "9px" }}>
                                            {medicament.TypeArticle || "PHARMACIE"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function LigneFormRow({
    ligne,
    medicaments,
    onChange,
    onRemove,
}: {
    ligne: LigneForm;
    medicaments: Pharmacie[];
    onChange: (updates: Partial<LigneForm>) => void;
    onRemove: () => void;
}) {
    const handleSelectMedicament = (medicamentId: string) => {
        const m = medicaments.find((med) => med._id === medicamentId);
        if (!m) return;
        onChange({
            IDMEDICAMENT: m._id,
            Medicament: m.Designation,
            Reference: m.Reference || "",
            TypeArticle: m.TypeArticle || "PHARMACIE",
            PrixAchat: m.PrixAchat || 0,
            PrixVente: m.PrixVente || 0,
        });
    };

    return (
        <tr>
            <td>
                <SearchableMedicamentSelect
                    medicaments={medicaments}
                    selectedId={ligne.IDMEDICAMENT || ""}
                    onSelect={handleSelectMedicament}
                />
            </td>
            <td className="text-center">
                <Badge bg={ligne.TypeArticle === "LABORATOIRE" ? "warning" : "info"} className="text-uppercase small">
                    {ligne.TypeArticle || "PHARMACIE"}
                </Badge>
            </td>
            <td>
                <Form.Control size="sm" type="text" value={ligne.Reference || ""} onChange={(e) => onChange({ Reference: e.target.value })} />
            </td>
            <td>
                <Form.Control size="sm" type="number" min={1} value={ligne.QteCommandee} onChange={(e) => onChange({ QteCommandee: Number(e.target.value) || 0 })} />
            </td>
            <td>
                <Form.Control size="sm" type="number" min={0} value={ligne.PrixAchat || 0} onChange={(e) => onChange({ PrixAchat: Number(e.target.value) || 0 })} />
            </td>
            <td>
                <Form.Control size="sm" type="number" min={0} value={ligne.TVA || 0} onChange={(e) => onChange({ TVA: Number(e.target.value) || 0 })} />
            </td>
            <td className="text-end fw-bold">{(ligne.TotalTTC || 0).toLocaleString("fr-FR")}</td>
            <td className="text-center">
                <Button size="sm" variant="danger" onClick={onRemove}>×</Button>
            </td>
        </tr>
    );
}

/* ------------------------------------------------------------------ */
/* Modal réception                                                    */
/* ------------------------------------------------------------------ */

function ReceptionModal({
    show,
    onHide,
    commande,
    onSaved,
    setError,
}: {
    show: boolean;
    onHide: () => void;
    commande: CommandeFournisseur | null;
    onSaved: () => void;
    setError: (msg: string) => void;
}) {
    const [lignes, setLignes] = useState<ReceptionLigneForm[]>([]);
    const [numeroFacture, setNumeroFacture] = useState("");
    const [observations, setObservations] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && commande) {
            setNumeroFacture("");
            setObservations(commande.Observations || "");
            setLignes(
                (commande.lignes || []).map((l) => ({
                    ligneId: l._id || "",
                    QteRecue: 0,
                    PrixAchat: l.PrixAchat || 0,
                    PrixVente: l.PrixVente || 0,
                    TVA: l.TVA || 0,
                    NumeroLot: "",
                    DatePeremption: "",
                    QteMinimum: 0,
                    QteMaximum: 0,
                    Reference: l.Reference,
                    Medicament: l.Medicament,
                    QteCommandee: l.QteCommandee,
                    QteDejaRecue: l.QteRecue || 0,
                }))
            );
        }
    }, [show, commande]);

    const updateLigne = (ligneId: string, updates: Partial<ReceptionLigneForm>) => {
        setLignes((prev) => prev.map((l) => (l.ligneId === ligneId ? { ...l, ...updates } : l)));
    };

    const handleSave = async () => {
        if (!commande?._id) return;
        const lignesARecevoir = lignes.filter((l) => l.QteRecue > 0);
        if (lignesARecevoir.length === 0) {
            setError("Veuillez saisir au moins une quantité reçue.");
            return;
        }
        for (const l of lignesARecevoir) {
            const max = (l.QteCommandee || 0) - (l.QteDejaRecue || 0);
            if (l.QteRecue > max) {
                setError(`La quantité reçue de ${l.Medicament} dépasse le reste à recevoir (${max}).`);
                return;
            }
        }

        setLoading(true);
        setError("");
        try {
            const utilisateur = localStorage.getItem("nom_utilisateur") || "Utilisateur";
            const payload = {
                NumeroFacture: numeroFacture,
                Observations: observations,
                SaisiPar: utilisateur,
                lignes: lignesARecevoir.map((l) => ({
                    ligneId: l.ligneId,
                    QteRecue: l.QteRecue,
                    PrixAchat: l.PrixAchat,
                    PrixVente: l.PrixVente,
                    TVA: l.TVA,
                    NumeroLot: l.NumeroLot,
                    DatePeremption: l.DatePeremption || null,
                    QteMinimum: l.QteMinimum,
                    QteMaximum: l.QteMaximum,
                })),
            };
            const res = await fetch(`/api/commande-fournisseur/${commande._id}/reception`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Erreur de réception");
            }
            onSaved();
            onHide();
        } catch (err: any) {
            setError(err.message || "Erreur de réception");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Réception — {commande?.NumeroCommande}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="g-2 mb-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">N° Facture fournisseur</Form.Label>
                            <Form.Control size="sm" value={numeroFacture} onChange={(e) => setNumeroFacture(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={8}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Observations</Form.Label>
                            <Form.Control size="sm" as="textarea" rows={1} value={observations} onChange={(e) => setObservations(e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>
                <div className="table-responsive" style={{ maxHeight: "50vh", overflow: "auto" }}>
                    <Table bordered hover size="sm" className="mb-0">
                        <thead className="table-light sticky-top">
                            <tr className="text-center">
                                <th>Médicament</th>
                                <th>Commandée</th>
                                <th>Déjà reçue</th>
                                <th>Qté reçue</th>
                                <th>Prix achat</th>
                                <th>Prix vente</th>
                                <th>TVA</th>
                                <th>N° Lot</th>
                                <th>Péremption</th>
                                <th>Seuil min</th>
                                <th>Seuil max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lignes.map((l) => {
                                const reste = (l.QteCommandee || 0) - (l.QteDejaRecue || 0);
                                return (
                                    <tr key={l.ligneId}>
                                        <td className="fw-semibold">{l.Medicament || "—"} <span className="text-muted small">({l.Reference})</span></td>
                                        <td className="text-center">{l.QteCommandee}</td>
                                        <td className="text-center">{l.QteDejaRecue}</td>
                                        <td>
                                            <Form.Control size="sm" type="number" min={0} max={reste}
                                                value={l.QteRecue}
                                                onChange={(e) => updateLigne(l.ligneId, { QteRecue: Math.min(Number(e.target.value) || 0, reste) })}
                                            />
                                            <small className="text-muted">Reste: {reste}</small>
                                        </td>
                                        <td>
                                            <Form.Control size="sm" type="number" min={0} value={l.PrixAchat} onChange={(e) => updateLigne(l.ligneId, { PrixAchat: Number(e.target.value) || 0 })} />
                                        </td>
                                        <td>
                                            <Form.Control size="sm" type="number" min={0} value={l.PrixVente} onChange={(e) => updateLigne(l.ligneId, { PrixVente: Number(e.target.value) || 0 })} />
                                        </td>
                                        <td>
                                            <Form.Control size="sm" type="number" min={0} value={l.TVA} onChange={(e) => updateLigne(l.ligneId, { TVA: Number(e.target.value) || 0 })} />
                                        </td>
                                        <td>
                                            <Form.Control size="sm" value={l.NumeroLot} onChange={(e) => updateLigne(l.ligneId, { NumeroLot: e.target.value })} />
                                        </td>
                                        <td>
                                            <Form.Control size="sm" type="date" value={l.DatePeremption} onChange={(e) => updateLigne(l.ligneId, { DatePeremption: e.target.value })} />
                                        </td>
                                        <td>
                                            <Form.Control size="sm" type="number" min={0} value={l.QteMinimum} onChange={(e) => updateLigne(l.ligneId, { QteMinimum: Number(e.target.value) || 0 })} />
                                        </td>
                                        <td>
                                            <Form.Control size="sm" type="number" min={0} value={l.QteMaximum} onChange={(e) => updateLigne(l.ligneId, { QteMaximum: Number(e.target.value) || 0 })} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={onHide} disabled={loading}>Fermer</Button>
                <Button variant="success" size="sm" onClick={handleSave} disabled={loading}>
                    <FaCheck className="me-1" /> {loading ? "Réception..." : "Valider la réception"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* ------------------------------------------------------------------ */
/* Modal détail                                                       */
/* ------------------------------------------------------------------ */

function DetailModal({
    show,
    onHide,
    commande,
    onPrintWithHeader,
    onPrintWithoutHeader,
}: {
    show: boolean;
    onHide: () => void;
    commande: CommandeFournisseur | null;
    onPrintWithHeader: (c: CommandeFournisseur) => void;
    onPrintWithoutHeader: (c: CommandeFournisseur) => void;
}) {
    if (!commande) return null;
    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Détail — {commande.NumeroCommande}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="g-2 mb-3 small">
                    <Col md={4}><strong>Fournisseur:</strong> {commande.NomFournisseur || "—"}</Col>
                    <Col md={4}><strong>Date:</strong> {formatDate(commande.DateCommande)}</Col>
                    <Col md={4}><strong>Livraison prévue:</strong> {formatDate(commande.DateLivraisonPrevue)}</Col>
                    <Col md={4}><strong>Statut:</strong> <Badge bg={STATUT_LABELS[commande.Statut || "BROUILLON"].variant}>{STATUT_LABELS[commande.Statut || "BROUILLON"].label}</Badge></Col>
                    <Col md={4}><strong>Saisi par:</strong> {commande.SaisiPar || "—"}</Col>
                    <Col md={12}><strong>Observations:</strong> {commande.Observations || "—"}</Col>
                </Row>
                <div className="table-responsive">
                    <Table bordered size="sm">
                        <thead className="table-dark text-center">
                            <tr>
                                <th>Médicament</th>
                                <th>Type</th>
                                <th>Qté commandée</th>
                                <th>Qté reçue</th>
                                <th>Prix achat</th>
                                <th>TVA</th>
                                <th>Total TTC</th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {(commande.lignes || []).map((l, i) => (
                                <tr key={l._id ?? i}>
                                    <td className="text-start fw-semibold">{l.Medicament || "—"} <span className="text-muted small">({l.Reference})</span></td>
                                    <td>
                                        <Badge bg={l.TypeArticle === "LABORATOIRE" ? "warning" : "info"} className="text-uppercase small">
                                            {l.TypeArticle || "PHARMACIE"}
                                        </Badge>
                                    </td>
                                    <td>{l.QteCommandee}</td>
                                    <td>{l.QteRecue || 0}</td>
                                    <td>{formatNumber(l.PrixAchat)}</td>
                                    <td>{formatNumber(l.TVA)}</td>
                                    <td className="fw-bold">{formatNumber(l.TotalTTC)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="table-secondary">
                                <td colSpan={6} className="text-end fw-bold">Total TTC</td>
                                <td className="fw-bold">{formatNumber(commande.MontantTTC)} FCFA</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={onHide}>Fermer</Button>
                <Button variant="outline-dark" size="sm" onClick={() => commande && onPrintWithoutHeader(commande)}>
                    <FaPrint className="me-1" /> Sans entête
                </Button>
                <Button variant="primary" size="sm" onClick={() => commande && onPrintWithHeader(commande)}>
                    <FaPrint className="me-1" /> Avec entête
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
