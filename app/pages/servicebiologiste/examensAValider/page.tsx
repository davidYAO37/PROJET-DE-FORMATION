'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    Alert, Badge, Button, Card, Col, Container,
    Form, InputGroup, Row, Spinner, Table
} from 'react-bootstrap';

const todayIso = () => new Date().toISOString().slice(0, 10);

interface Examen {
    _id: string;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    StatutLaboratoire?: number;
    IdPatient?: string;
    Datetransferbiologiste?: string;
    Code_dossier?: string;
    NIdentificationExamen?: string;
    ProvenanceExamen?: string;
    Externe_Interne?: string;
}

const statutLabel = (s?: number) => {
    switch (s) {
        case 1: return { label: 'Reçu', bg: 'secondary' };
        case 2: return { label: 'En cours', bg: 'warning' };
        case 3: return { label: 'À valider', bg: 'danger' };
        case 4: return { label: 'Retourné', bg: 'info' };
        case 5: return { label: 'Validé', bg: 'success' };
        default: return { label: 'Inconnu', bg: 'light' };
    }
};

const fmtDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ExamensAValider() {
    const [dateDebut, setDateDebut] = useState(todayIso());
    const [dateFin, setDateFin] = useState(todayIso());
    const [search, setSearch] = useState('');
    const [examens, setExamens] = useState<Examen[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [total, setTotal] = useState(0);

    const charger = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams({ dateDebut, dateFin });
            if (search) params.set('search', search);
            const res = await fetch(`/api/examens/aValider?${params}`);
            if (!res.ok) throw new Error('Erreur chargement');
            const json = await res.json();
            setExamens(json.examens || []);
            setTotal(json.total || 0);
        } catch (err: any) {
            setError(err.message || 'Erreur serveur');
        } finally {
            setLoading(false);
        }
    }, [dateDebut, dateFin, search]);

    useEffect(() => { charger(); }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') charger();
    };

    return (
        <Container fluid className="py-4 px-3" style={{ background: '#f8f9fa', minHeight: '100vh' }}>

            {/* En-tête */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <Badge bg="danger" className="mb-1">Laboratoire</Badge>
                    <h4 className="fw-bold mb-0">
                        <i className="bi bi-clipboard2-pulse-fill me-2 text-danger"></i>
                        Examens à Valider
                    </h4>
                    <small className="text-muted">
                        Examens biologiques transférés au biologiste — StatutLaboratoire = 3
                    </small>
                </div>
                <Button variant="outline-danger" size="sm" onClick={charger} disabled={loading}>
                    <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
                    Actualiser
                </Button>
            </div>

            {/* Filtres */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3} sm={6}>
                            <Form.Label className="fw-semibold small">Date début transfert</Form.Label>
                            <Form.Control
                                type="date"
                                value={dateDebut}
                                onChange={e => setDateDebut(e.target.value)}
                            />
                        </Col>
                        <Col md={3} sm={6}>
                            <Form.Label className="fw-semibold small">Date fin transfert</Form.Label>
                            <Form.Control
                                type="date"
                                value={dateFin}
                                onChange={e => setDateFin(e.target.value)}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Recherche patient</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Nom du patient..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                {search && (
                                    <Button variant="outline-secondary" onClick={() => { setSearch(''); }}>
                                        <i className="bi bi-x"></i>
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>
                        <Col md={2}>
                            <Button variant="danger" className="w-100" onClick={charger} disabled={loading}>
                                <i className="bi bi-funnel-fill me-1"></i>Filtrer
                            </Button>
                        </Col>
                        <Col md={1}>
                            <Button variant="outline-secondary" className="w-100" title="Réinitialiser" onClick={() => {
                                setDateDebut(todayIso());
                                setDateFin(todayIso());
                                setSearch('');
                            }}>
                                <i className="bi bi-x-circle"></i>
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            {/* Compteur */}
            {!loading && (
                <div className="d-flex align-items-center gap-2 mb-3">
                    <Badge bg="danger" pill className="px-3 py-2 fs-6">{total}</Badge>
                    <span className="text-muted small">
                        examen{total > 1 ? 's' : ''} en attente de validation
                    </span>
                </div>
            )}

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="danger" style={{ width: 44, height: 44 }} />
                    <p className="mt-3 text-muted">Chargement des examens...</p>
                </div>
            )}

            {!loading && (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <Table hover responsive className="mb-0 small">
                            <thead className="table-danger">
                                <tr>
                                    <th>#</th>
                                    <th>Code Prescription</th>
                                    <th>Patient</th>
                                    <th>N° Dossier</th>
                                    <th>N° Identification</th>
                                    <th>Provenance</th>
                                    <th>Interne / Externe</th>
                                    <th className="text-center">Date Transfert</th>
                                    <th className="text-center">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examens.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center text-muted py-5">
                                            <i className="bi bi-inbox fs-3 d-block mb-2 opacity-25"></i>
                                            Aucun examen à valider sur cette période.
                                        </td>
                                    </tr>
                                ) : (
                                    examens.map((e, i) => {
                                        const statut = statutLabel(e.StatutLaboratoire);
                                        return (
                                            <tr key={e._id}>
                                                <td className="text-muted">{i + 1}</td>
                                                <td>
                                                    <span className="fw-semibold text-primary">
                                                        {e.CodePrestation || '—'}
                                                    </span>
                                                </td>
                                                <td className="fw-semibold">{e.PatientP || '—'}</td>
                                                <td className="text-muted">{e.Code_dossier || '—'}</td>
                                                <td className="text-muted">{e.NIdentificationExamen || '—'}</td>
                                                <td>{e.ProvenanceExamen || '—'}</td>
                                                <td>
                                                    {e.Externe_Interne ? (
                                                        <Badge bg={e.Externe_Interne === 'Externe' ? 'warning' : 'info'} text="dark">
                                                            {e.Externe_Interne}
                                                        </Badge>
                                                    ) : '—'}
                                                </td>
                                                <td className="text-center text-muted">
                                                    {fmtDate(e.Datetransferbiologiste)}
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg={statut.bg} text={statut.bg === 'warning' || statut.bg === 'light' ? 'dark' : undefined}>
                                                        {statut.label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </Container>
    );
}
