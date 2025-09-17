"use client";


import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import { Assurance } from "@/types/assurance";

interface SocieteAssurance {
    _id: string;
    societe: string;
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
                            body: JSON.stringify({ societe: assurance.desiganationassurance, assuranceId: assurance._id })
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
            setForm({ societe: "" });
            // Refresh list
            const data = await res.json();
            setSocietes(data);
        }
        setCreating(false);
    };

    async function handleEditSave(id: string) {
        if (!editValue.trim()) return;
        setSavingEdit(true);
        const res = await fetch("/api/societeassurance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, societe: editValue })
        });
        if (res.ok) {
            const data = await res.json();
            setSocietes(data);
            setEditId(null);
        }
        setSavingEdit(false);
    }

    async function handleDelete(id: string) {
        if (!window.confirm("Voulez-vous vraiment supprimer cette société ?")) return;
        setDeletingId(id);
        const res = await fetch("/api/societeassurance", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            const data = await res.json();
            setSocietes(data);
        }
        setDeletingId(null);
    }

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    <i className="bi bi-building me-2" />
                    Sociétés d'assurance de : <span className="fw-bold">{assurance?.desiganationassurance}</span>
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
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {societes.length === 0 ? (
                                    <tr><td colSpan={2} className="text-center text-muted">Aucune société trouvée.</td></tr>
                                ) : (
                                    societes.map(s => (
                                        <tr key={s._id}>
                                            <td className="Col-8 text-center fw-semibold">
                                                {editId === s._id ? (
                                                    <Form.Control
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        size="sm"
                                                        autoFocus
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                handleEditSave(s._id);
                                                            }
                                                        }}
                                                        disabled={savingEdit}
                                                    />
                                                ) : (
                                                    s.societe
                                                )}
                                            </td>
                                            <td className="Col-4 text-center">
                                                {editId === s._id ? (
                                                    <>
                                                        <Button size="sm" variant="success" className="me-2" disabled={savingEdit || !editValue.trim()} onClick={() => handleEditSave(s._id)}>
                                                            {savingEdit ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg" />} Enregistrer
                                                        </Button>
                                                        <Button size="sm" variant="outline-secondary" onClick={() => setEditId(null)} disabled={savingEdit}>
                                                            Annuler
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => { setEditId(s._id); setEditValue(s.societe); }}>
                                                            <i className="bi bi-pencil-square" /> Modifier
                                                        </Button>
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
        </Modal>
    );
}
