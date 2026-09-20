"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import { Assurance } from "@/types/assurance";
import TarifSocieteAssuranceModal from "./TarifSocieteAssuranceModal";

interface SocieteAssurance {
    _id: string;
    societe: string;
    accepteSurplus?: boolean | null;
    utiliseTarifsPropres?: boolean;
}

type Props = {
    show: boolean;
    onHide: () => void;
    assurance: Assurance | null;
};

export default function SocieteAssuranceModal({ show, onHide, assurance }: Props) {
    const [societes, setSocietes] = useState<SocieteAssurance[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ societe: "" });
    const [creating, setCreating] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editSurplus, setEditSurplus] = useState<boolean | null>(null);
    const [editTarifs, setEditTarifs] = useState<boolean>(true);

    const [showTarifs, setShowTarifs] = useState(false);
    const [selectedSociete, setSelectedSociete] = useState<SocieteAssurance | null>(null);

    // Charger les sociétés liées à l'assurance
    useEffect(() => {
        if (show && assurance) {
            setLoading(true);
            fetch(`/api/societeassurance?assuranceId=${assurance._id}`)
                .then(res => res.json())
                .then(async data => {
                    if (Array.isArray(data) && data.length === 0) {
                        // Créer automatiquement la société avec le nom de l'assurance
                        const res = await fetch("/api/societeassurance", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ societe: assurance.designationassurance, assuranceId: assurance._id })
                        });
                        if (res.ok) {
                            const societes = await res.json();
                            setSocietes(societes);
                        } else {
                            setSocietes([]);
                        }
                    } else {
                        setSocietes(Array.isArray(data) ? data : []);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [show, assurance]);

    // Ajouter une société
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assurance) return;
        setCreating(true);
        const res = await fetch("/api/societeassurance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, assuranceId: assurance._id }),
        });
        if (res.ok) {
            const data = await res.json();
            const societesList = data.societes || data;
            const created = data.created;

            setSocietes(societesList);
            setForm({ societe: "" });

            // Initialiser les tarifs propres de la société comme une copie des tarifs assurance
            if (created?._id && assurance?._id) {
                await fetch(`/api/tarifs/${assurance._id}`).catch(() => {});
                await fetch(`/api/tarifs-societe-assurance?societeAssuranceId=${created._id}`).catch(() => {});
            }
        }
        setCreating(false);
    };

    // Modifier une société
    const handleEditSave = async (id: string) => {
        if (!editValue.trim() || !assurance) return;
        setSavingEdit(true);
        const res = await fetch("/api/societeassurance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, societe: editValue, assuranceId: assurance._id, accepteSurplus: editSurplus, utiliseTarifsPropres: editTarifs })
        });
        if (res.ok) {
            const data = await res.json();
            setSocietes(data);
            setEditId(null);
            setEditSurplus(null);
        }
        setSavingEdit(false);
    };

    const openTarifs = (s: SocieteAssurance) => {
        setSelectedSociete(s);
        setShowTarifs(true);
    };

    // Supprimer une société
    const handleDelete = async (id: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette société ?") || !assurance) return;
        setDeletingId(id);
        const res = await fetch("/api/societeassurance", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, assuranceId: assurance._id })
        });
        if (res.ok) {
            const data = await res.json();
            setSocietes(data);
        }
        setDeletingId(null);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    <i className="bi bi-building me-2" />
                    Sociétés d'assurance de : <span className="fw-bold">{assurance?.designationassurance}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status" />
                        <div className="mt-2">Chargement...</div>
                    </div>
                ) : (
                    <>
                        <Table bordered hover responsive size="sm" className="bg-white rounded shadow-sm">
                            <thead className="table-primary">
                                <tr>
                                    <th className="text-center">Nom de la société</th>
                                    <th className="text-center">Tarifs utilisés</th>
                                    <th className="text-center">Surplus</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {societes.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center text-muted">Aucune société trouvée.</td></tr>
                                ) : (
                                    societes.map(s => (
                                        <tr key={s._id}>
                                            <td className="text-center fw-semibold" style={{ width: "30%" }}>
                                                {editId === s._id ? (
                                                    <Form.Control
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        size="sm"
                                                        autoFocus
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleEditSave(s._id);
                                                        }}
                                                        disabled={savingEdit}
                                                    />
                                                ) : (
                                                    s.societe
                                                )}
                                            </td>
                                            <td className="text-center" style={{ width: "20%" }}>
                                                {editId === s._id ? (
                                                    <Form.Select
                                                        size="sm"
                                                        value={editTarifs ? "propres" : "assurance"}
                                                        onChange={e => setEditTarifs(e.target.value === "propres")}
                                                    >
                                                        <option value="propres">Propres tarifs</option>
                                                        <option value="assurance">Tarifs de l'assurance</option>
                                                    </Form.Select>
                                                ) : (
                                                    s.utiliseTarifsPropres === false ? "Tarifs assurance" : "Propres tarifs"
                                                )}
                                            </td>
                                            <td className="text-center" style={{ width: "20%" }}>
                                                {editId === s._id ? (
                                                    <Form.Select
                                                        size="sm"
                                                        value={editSurplus === null ? "" : editSurplus ? "true" : "false"}
                                                        onChange={e => {
                                                            const v = e.target.value;
                                                            setEditSurplus(v === "" ? null : v === "true");
                                                        }}
                                                    >
                                                        <option value="">Hérite de l'assurance</option>
                                                        <option value="true">Avec surplus</option>
                                                        <option value="false">Sans surplus</option>
                                                    </Form.Select>
                                                ) : (
                                                    s.accepteSurplus === true ? "Avec surplus" :
                                                    s.accepteSurplus === false ? "Sans surplus" :
                                                    "Hérite"
                                                )}
                                            </td>
                                            <td className="text-center" style={{ width: "30%" }}>
                                                {editId === s._id ? (
                                                    <>
                                                        <Button size="sm" variant="success" className="me-2" disabled={savingEdit || !editValue.trim()} onClick={() => handleEditSave(s._id)}>
                                                            {savingEdit ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg" />} Enregistrer
                                                        </Button>
                                                        <Button size="sm" variant="outline-secondary" onClick={() => { setEditId(null); setEditSurplus(null); }} disabled={savingEdit}>
                                                            Annuler
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => { setEditId(s._id); setEditValue(s.societe); setEditSurplus(s.accepteSurplus ?? null); setEditTarifs(s.utiliseTarifsPropres ?? true); }}>
                                                            <i className="bi bi-pencil-square" /> Modifier
                                                        </Button>
                                                        {s.utiliseTarifsPropres !== false && (
                                                            <Button size="sm" variant="outline-info" className="me-2" onClick={() => openTarifs(s)}>
                                                                <i className="bi bi-currency-exchange" /> Tarifs
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="outline-danger" disabled={deletingId === s._id} onClick={() => handleDelete(s._id)}>
                                                            {deletingId === s._id ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-trash" />} Supprimer
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>

                        <div className="my-4 p-3 bg-white rounded shadow-sm border">
                            <h6 className="mb-3 text-primary"><i className="bi bi-plus-circle me-2" />Ajouter une société d'assurance</h6>
                            <Form onSubmit={handleCreate} className="row g-2 align-items-center">
                                <Form.Group className="col-md-9 mb-0">
                                    <Form.Control required placeholder="Nom de la société" value={form.societe} onChange={e => setForm(f => ({ ...f, societe: e.target.value }))} size="lg" />
                                </Form.Group>
                                <div className="col-md-3 d-flex justify-content-end">
                                    <Button type="submit" disabled={creating || !form.societe.trim()} variant="primary" className="rounded-pill px-4 shadow">
                                        {creating ? <span><span className="spinner-border spinner-border-sm me-2" />Ajout...</span> : <span><i className="bi bi-plus-lg me-2" />Ajouter</span>}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="outline-secondary" onClick={onHide} className="rounded-pill px-4">
                    <i className="bi bi-x-lg me-2" />Fermer
                </Button>
            </Modal.Footer>

            <TarifSocieteAssuranceModal
                show={showTarifs}
                onHide={() => {
                    setShowTarifs(false);
                    setSelectedSociete(null);
                }}
                societe={selectedSociete}
                assuranceId={assurance?._id}
            />
        </Modal>
    );
}
