'use client';
import { useState, useEffect } from 'react';
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';

interface IParametreNfs {
    _id: string;
    PARAMETRE?: string;
    DESCRIPTION?: string;
}

const EMPTY_FORM = { PARAMETRE: '', DESCRIPTION: '' };

export default function GestionParametreNfs() {
    const [params, setParams] = useState<IParametreNfs[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<IParametreNfs | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState('');

    const charger = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/automates/parametreNfs');
            const json = await res.json();
            if (json.success) setParams(json.data);
        } catch {
            setMessage({ type: 'danger', text: 'Erreur lors du chargement.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { charger(); }, []);

    const openCreate = () => {
        setEditItem(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (item: IParametreNfs) => {
        setEditItem(item);
        setForm({ PARAMETRE: item.PARAMETRE || '', DESCRIPTION: item.DESCRIPTION || '' });
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.PARAMETRE.trim()) return;
        try {
            setSaving(true);
            setMessage(null);
            let res: Response;
            if (editItem) {
                res = await fetch(`/api/automates/parametreNfs/${editItem._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            } else {
                res = await fetch('/api/automates/parametreNfs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            }
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setMessage({ type: 'success', text: json.message || 'Opération réussie.' });
            setShowModal(false);
            await charger();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Erreur.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce paramètre NFS ?')) return;
        try {
            setMessage(null);
            const res = await fetch(`/api/automates/parametreNfs/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setMessage({ type: 'success', text: 'Paramètre supprimé.' });
            await charger();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Erreur.' });
        }
    };

    const filtered = params.filter(p =>
        (p.PARAMETRE || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.DESCRIPTION || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-primary mb-0">
                    <i className="bi bi-droplet-fill me-2"></i>Paramètres NFS
                </h5>
                <Button variant="primary" size="sm" onClick={openCreate}>
                    <i className="bi bi-plus-lg me-1"></i>Nouveau
                </Button>
            </div>

            {message && (
                <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            <Row className="mb-3">
                <Col md={6}>
                    <Form.Control
                        type="search"
                        placeholder="Rechercher un paramètre..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Chargement...</p>
                        </div>
                    ) : (
                        <Table hover responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Paramètre</th>
                                    <th>Description</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted py-4">
                                            Aucun paramètre NFS trouvé.
                                        </td>
                                    </tr>
                                ) : filtered.map((p, i) => (
                                    <tr key={p._id}>
                                        <td>{i + 1}</td>
                                        <td><span className="fw-semibold">{p.PARAMETRE}</span></td>
                                        <td>{p.DESCRIPTION}</td>
                                        <td className="text-center">
                                            <Button
                                                size="sm"
                                                variant="outline-warning"
                                                className="me-1"
                                                onClick={() => openEdit(p)}
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => handleDelete(p._id)}
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editItem ? 'Modifier' : 'Nouveau'} Paramètre NFS</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Paramètre <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                name="PARAMETRE"
                                value={form.PARAMETRE}
                                onChange={handleChange}
                                placeholder="Ex: GR, GB, HGB..."
                                required
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="fw-semibold">Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="DESCRIPTION"
                                value={form.DESCRIPTION}
                                onChange={handleChange}
                                placeholder="Description du paramètre"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? <><Spinner size="sm" className="me-1" />Enregistrement...</> : <><i className="bi bi-save me-1"></i>Enregistrer</>}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
