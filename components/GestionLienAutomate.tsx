'use client';
import { useState, useEffect } from 'react';
import { Button, Card, Col, Form, Row, Spinner, Alert } from 'react-bootstrap';

interface LienAutomateData {
    _id?: string;
    nLienNFS?: string;
    LienHormone?: string;
    LienVS?: string;
    LienBiochimie?: string;
}

export default function GestionLienAutomate() {
    const [data, setData] = useState<LienAutomateData>({
        nLienNFS: '',
        LienHormone: '',
        LienVS: '',
        LienBiochimie: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

    const charger = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/automates/lienAutomate');
            const json = await res.json();
            if (json.success && json.data) {
                setData({
                    _id: json.data._id,
                    nLienNFS: json.data.nLienNFS || '',
                    LienHormone: json.data.LienHormone || '',
                    LienVS: json.data.LienVS || '',
                    LienBiochimie: json.data.LienBiochimie || '',
                });
            }
        } catch {
            setMessage({ type: 'danger', text: 'Erreur lors du chargement des liens.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { charger(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            const res = await fetch('/api/automates/lienAutomate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setMessage({ type: 'success', text: json.message || 'Liens sauvegardés.' });
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Erreur lors de la sauvegarde.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Chargement...</p>
        </div>
    );

    return (
        <div>
            <h5 className="fw-bold text-primary mb-3">
                <i className="bi bi-link-45deg me-2"></i>Liens Automates
            </h5>
            {message && (
                <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        <i className="bi bi-droplet-fill me-1 text-danger"></i>Lien NFS
                                    </Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="nLienNFS"
                                        value={data.nLienNFS || ''}
                                        onChange={handleChange}
                                        placeholder="http://192.168.x.x/nfs/data.json"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        <i className="bi bi-activity me-1 text-warning"></i>Lien Hormones
                                    </Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="LienHormone"
                                        value={data.LienHormone || ''}
                                        onChange={handleChange}
                                        placeholder="http://192.168.x.x/hormones/data.json"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        <i className="bi bi-clock-history me-1 text-info"></i>Lien VS (Vitesse Sédimentation)
                                    </Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="LienVS"
                                        value={data.LienVS || ''}
                                        onChange={handleChange}
                                        placeholder="http://192.168.x.x/vs/data.json"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        <i className="bi bi-flask me-1 text-success"></i>Lien Biochimie
                                    </Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="LienBiochimie"
                                        value={data.LienBiochimie || ''}
                                        onChange={handleChange}
                                        placeholder="http://192.168.x.x/biochimie/data.json"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="text-end">
                                <Button type="submit" variant="primary" disabled={saving}>
                                    {saving ? <><Spinner size="sm" className="me-2" />Enregistrement...</> : <><i className="bi bi-save me-2"></i>Enregistrer</>}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
