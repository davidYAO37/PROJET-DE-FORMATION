"use client";

import { useState, useEffect } from "react";
import { Button, Table, Badge, Spinner, Form, Modal } from "react-bootstrap";
import { FaEdit, FaTrash, FaBed, FaPlus } from "react-icons/fa";

interface ChambreItem {
    _id: string;
    numero: string;
    type: string;
    service: string;
    tarifJournalier: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    nombreLits: number;
    etat: string;
    observation?: string;
}

interface LitItem {
    _id: string;
    numero: string;
    chambreId: string;
    etat: string;
    observation?: string;
}

type Props = {
    chambres: ChambreItem[];
    onEdit: (chambre: ChambreItem) => void;
    onDelete: (id: string) => void;
};

export default function ListeChambre({ chambres, onEdit, onDelete }: Props) {
    const [search, setSearch] = useState("");
    const [selectedChambre, setSelectedChambre] = useState<ChambreItem | null>(null);
    const [lits, setLits] = useState<LitItem[]>([]);
    const [allLits, setAllLits] = useState<LitItem[]>([]);
    const [loadingLits, setLoadingLits] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllLits = async () => {
            try {
                const res = await fetch("/api/lits");
                if (res.ok) {
                    const data = await res.json();
                    setAllLits(Array.isArray(data) ? data : []);
                }
            } catch { /* ignore */ }
        };
        fetchAllLits();
    }, [chambres]);

    // CRUD Lit states
    const [showAddLit, setShowAddLit] = useState(false);
    const [showEditLit, setShowEditLit] = useState(false);
    const [litForm, setLitForm] = useState({ numero: "", observation: "" });
    const [editingLit, setEditingLit] = useState<LitItem | null>(null);
    const [litLoading, setLitLoading] = useState(false);
    const [litError, setLitError] = useState("");

    const filteredChambres = chambres.filter((c) =>
        c.numero?.toLowerCase().includes(search.toLowerCase()) ||
        c.type?.toLowerCase().includes(search.toLowerCase()) ||
        c.service?.toLowerCase().includes(search.toLowerCase())
    );

    const fetchLits = async (chambreId: string) => {
        setLoadingLits(true);
        try {
            const res = await fetch(`/api/lits?chambreId=${chambreId}`);
            if (res.ok) {
                const data = await res.json();
                setLits(Array.isArray(data) ? data : []);
            } else {
                setLits([]);
            }
        } catch {
            setLits([]);
        } finally {
            setLoadingLits(false);
        }
    };

    const refreshAllLits = async () => {
        try {
            const res = await fetch("/api/lits");
            if (res.ok) {
                const data = await res.json();
                setAllLits(Array.isArray(data) ? data : []);
            }
        } catch { /* ignore */ }
    };

    const getLitsChambre = (chambreId: string) => allLits.filter(l => l.chambreId === chambreId);
    const getLitsLibres = (chambreId: string) => getLitsChambre(chambreId).filter(l => l.etat === "libre").length;
    const getLitsOccupes = (chambreId: string) => getLitsChambre(chambreId).filter(l => l.etat === "occupe").length;

    const handleSelectChambre = async (chambre: ChambreItem) => {
        setSelectedChambre(chambre);
        await fetchLits(chambre._id);
    };

    const getEtatBadge = (etat: string) => {
        switch (etat) {
            case "libre": return "success";
            case "occupee": case "occupe": return "danger";
            case "reservee": case "reserve": return "warning";
            case "maintenance": case "nettoyage": return "secondary";
            case "fermee": return "dark";
            default: return "light";
        }
    };

    // --- CRUD Lit handlers ---
    const handleAddLitOpen = () => {
        setLitForm({ numero: "", observation: "" });
        setLitError("");
        setShowAddLit(true);
    };

    const handleAddLitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChambre) return;
        setLitLoading(true);
        setLitError("");
        try {
            const res = await fetch("/api/lits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    numero: litForm.numero.trim(),
                    chambreId: selectedChambre._id,
                    observation: litForm.observation.trim(),
                    etat: "libre",
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || err.details || "Erreur lors de l'ajout du lit");
            }
            setShowAddLit(false);
            await fetchLits(selectedChambre._id);
            await refreshAllLits();
        } catch (err: any) {
            setLitError(err.message);
        } finally {
            setLitLoading(false);
        }
    };

    const handleEditLitOpen = (lit: LitItem) => {
        setEditingLit(lit);
        setLitForm({ numero: lit.numero, observation: lit.observation || "" });
        setLitError("");
        setShowEditLit(true);
    };

    const handleEditLitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLit || !selectedChambre) return;
        setLitLoading(true);
        setLitError("");
        try {
            const res = await fetch(`/api/lits/${editingLit._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    numero: litForm.numero.trim(),
                    observation: litForm.observation.trim(),
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || err.details || "Erreur lors de la modification du lit");
            }
            setShowEditLit(false);
            setEditingLit(null);
            await fetchLits(selectedChambre._id);
            await refreshAllLits();
        } catch (err: any) {
            setLitError(err.message);
        } finally {
            setLitLoading(false);
        }
    };

    const handleDeleteLit = async (litId: string) => {
        if (!selectedChambre) return;
        if (!window.confirm("Supprimer ce lit ?")) return;
        try {
            const res = await fetch(`/api/lits/${litId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Échec de suppression");
            await fetchLits(selectedChambre._id);
            await refreshAllLits();
        } catch {
            alert("Erreur lors de la suppression du lit");
        }
    };

    return (
        <>
            <div className="row g-2 mb-3 align-items-center">
                <div className="col-auto">
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Filtrer par numéro, type ou service..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ minWidth: 260 }}
                    />
                </div>
                <div className="col-auto">
                    <small className="text-muted">{filteredChambres.length} chambre(s)</small>
                </div>
            </div>

            <div className="table-responsive">
                <Table bordered hover className="text-center">
                    <thead className="table-primary">
                        <tr>
                            <th>Numéro</th>
                            <th>Type</th>
                            <th>Service</th>
                            <th>Total Lits</th>
                            <th>Occupés</th>
                            <th>Libres</th>
                            <th>État</th>
                            <th>Prix Clinique</th>
                            <th>Prix Mutuel</th>
                            <th>Prix Préf.</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredChambres.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="text-center text-muted">
                                    Aucune chambre trouvée.
                                </td>
                            </tr>
                        ) : (
                            filteredChambres.map((chambre) => (
                                <tr
                                    key={chambre._id}
                                    className={selectedChambre?._id === chambre._id ? "table-active" : ""}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleSelectChambre(chambre)}
                                >
                                    <td className="fw-bold">{chambre.numero}</td>
                                    <td>{chambre.type}</td>
                                    <td>{chambre.service}</td>
                                    <td>{getLitsChambre(chambre._id).length}</td>
                                    <td><Badge bg="danger">{getLitsOccupes(chambre._id)}</Badge></td>
                                    <td><Badge bg="success">{getLitsLibres(chambre._id)}</Badge></td>
                                    <td><Badge bg={getEtatBadge(chambre.etat)}>{chambre.etat}</Badge></td>
                                    <td>{chambre.prixClinique ?? 0} FCFA</td>
                                    <td>{chambre.prixMutuel ?? 0} FCFA</td>
                                    <td>{chambre.prixPreferentiel ?? 0} FCFA</td>
                                    <td className="d-flex justify-content-center" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            size="sm"
                                            variant="outline-info"
                                            className="me-1"
                                            title="Voir les lits"
                                            onClick={() => handleSelectChambre(chambre)}
                                        >
                                            <FaBed />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="me-1"
                                            title={getLitsChambre(chambre._id).length > 0 ? "Supprimez d'abord les lits pour modifier" : "Modifier"}
                                            onClick={() => { setActionLoading('edit-' + chambre._id); onEdit(chambre); }}
                                            disabled={actionLoading === 'edit-' + chambre._id || getLitsChambre(chambre._id).length > 0}
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            title={getLitsChambre(chambre._id).length > 0 ? "Supprimez d'abord les lits pour supprimer" : "Supprimer"}
                                            disabled={actionLoading === 'delete-' + chambre._id || getLitsChambre(chambre._id).length > 0}
                                            onClick={async () => {
                                                if (window.confirm(`Supprimer la chambre "${chambre.numero}" ?`)) {
                                                    setActionLoading('delete-' + chambre._id);
                                                    await onDelete(chambre._id);
                                                    setActionLoading(null);
                                                    if (selectedChambre?._id === chambre._id) {
                                                        setSelectedChambre(null);
                                                        setLits([]);
                                                    }
                                                }
                                            }}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {selectedChambre && (
                <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                            <FaBed className="me-2" />
                            Liste des lits — Chambre N° {selectedChambre.numero} - {selectedChambre.type}
                        </h5>
                        <Button variant="success" size="sm" onClick={handleAddLitOpen}>
                            <FaPlus className="me-1" /> Ajouter un lit
                        </Button>
                    </div>
                    {loadingLits ? (
                        <div className="text-center py-3">
                            <Spinner animation="border" size="sm" /> Chargement des lits...
                        </div>
                    ) : lits.length === 0 ? (
                        <p className="text-muted">Aucun lit enregistré pour cette chambre.</p>
                    ) : (
                        <div className="table-responsive">
                            <Table bordered hover size="sm" className="text-center">
                                <thead className="table-success">
                                    <tr>
                                        <th>Numéro du lit</th>
                                        <th>État</th>
                                        <th>Observation</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lits.map((lit) => (
                                        <tr key={lit._id}>
                                            <td className="fw-bold">{lit.numero}</td>
                                            <td><Badge bg={getEtatBadge(lit.etat)}>{lit.etat}</Badge></td>
                                            <td>{lit.observation || "—"}</td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    className="me-1"
                                                    title={lit.etat === "occupe" ? "Lit occupé — modification impossible" : "Modifier"}
                                                    onClick={() => handleEditLitOpen(lit)}
                                                    disabled={lit.etat === "occupe"}
                                                >
                                                    <FaEdit />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    title={lit.etat === "occupe" ? "Lit occupé — suppression impossible" : "Supprimer"}
                                                    onClick={() => handleDeleteLit(lit._id)}
                                                    disabled={lit.etat === "occupe"}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Ajouter Lit */}
            <Modal show={showAddLit} onHide={() => setShowAddLit(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter un lit — Chambre {selectedChambre?.numero}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddLitSubmit}>
                    <Modal.Body>
                        {litError && <div className="text-danger mb-2">{litError}</div>}
                        <Form.Group className="mb-2">
                            <Form.Label>Numéro du lit</Form.Label>
                            <Form.Control
                                value={litForm.numero}
                                onChange={(e) => setLitForm({ ...litForm, numero: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Observation</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={litForm.observation}
                                onChange={(e) => setLitForm({ ...litForm, observation: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddLit(false)} disabled={litLoading}>Annuler</Button>
                        <Button type="submit" variant="success" disabled={litLoading}>
                            {litLoading ? "Ajout..." : "Ajouter"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal Modifier Lit */}
            <Modal show={showEditLit} onHide={() => setShowEditLit(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Modifier le lit</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditLitSubmit}>
                    <Modal.Body>
                        {litError && <div className="text-danger mb-2">{litError}</div>}
                        <Form.Group className="mb-2">
                            <Form.Label>Numéro du lit</Form.Label>
                            <Form.Control
                                value={litForm.numero}
                                onChange={(e) => setLitForm({ ...litForm, numero: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Observation</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={litForm.observation}
                                onChange={(e) => setLitForm({ ...litForm, observation: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditLit(false)} disabled={litLoading}>Annuler</Button>
                        <Button type="submit" variant="primary" disabled={litLoading}>
                            {litLoading ? "Modification..." : "Enregistrer"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}
