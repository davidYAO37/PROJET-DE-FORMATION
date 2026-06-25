'use client';
import { useState, useCallback } from 'react';
import {
    Alert, Badge, Button, ButtonGroup, Card, Col,
    Container, Form, ProgressBar, Row, Spinner, Table
} from 'react-bootstrap';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const todayIso = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR');
const fmtMontant = (n: number) => `${fmt(n)} FCFA`;
const fmtPct = (n: number) => `${Number(n || 0).toFixed(2)} %`;

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#343a40'];

interface Ligne {
    label: string;
    famille?: string;
    montant: number;
    pourcentageMontant: number;
    nombre: number;
    pourcentageNombre: number;
}

interface ReleveData {
    totaux: { montantTotal: number; nombreTotal: number };
    mode: string;
    lignes: Ligne[];
}

export default function ReleveCompteBiologie() {
    const [dateDebut, setDateDebut] = useState(thirtyDaysAgo());
    const [dateFin, setDateFin] = useState(todayIso());
    const [mode, setMode] = useState<'acte' | 'famille'>('acte');
    const [data, setData] = useState<ReleveData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const charger = useCallback(async (modeOverride?: 'acte' | 'famille') => {
        const modeActif = modeOverride ?? mode;
        try {
            setLoading(true);
            setError('');
            const res = await fetch(
                `/api/statistiques/releveCompte?dateDebut=${dateDebut}&dateFin=${dateFin}&mode=${modeActif}`
            );
            if (!res.ok) throw new Error('Erreur chargement');
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message || 'Erreur serveur');
        } finally {
            setLoading(false);
        }
    }, [dateDebut, dateFin, mode]);

    const handleModeChange = (m: 'acte' | 'famille') => {
        setMode(m);
        charger(m);
    };

    const handlePrint = () => window.print();

    return (
        <Container fluid className="py-4 px-3" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
            {/* En-tête */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <Badge bg="success" className="mb-1">Laboratoire</Badge>
                    <h4 className="fw-bold mb-0">
                        <i className="bi bi-receipt me-2 text-success"></i>
                        Relevé de Compte — Biologie
                    </h4>
                    <small className="text-muted">Chiffre d'affaires des actes biologiques par date de paiement caisse</small>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={handlePrint} disabled={!data}>
                        <i className="bi bi-printer me-1"></i>Imprimer
                    </Button>
                    <Button variant="outline-success" size="sm" onClick={() => charger()} disabled={loading}>
                        <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Filtres */}
            <Card className="border-0 shadow-sm mb-4 no-print">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3} sm={6}>
                            <Form.Label className="fw-semibold small">Date début (paiement)</Form.Label>
                            <Form.Control
                                type="date"
                                value={dateDebut}
                                onChange={e => setDateDebut(e.target.value)}
                            />
                        </Col>
                        <Col md={3} sm={6}>
                            <Form.Label className="fw-semibold small">Date fin (paiement)</Form.Label>
                            <Form.Control
                                type="date"
                                value={dateFin}
                                onChange={e => setDateFin(e.target.value)}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="fw-semibold small">Vue</Form.Label>
                            <br />
                            <ButtonGroup>
                                <Button
                                    size="sm"
                                    variant={mode === 'acte' ? 'primary' : 'outline-primary'}
                                    onClick={() => setMode('acte')}
                                >
                                    <i className="bi bi-list-ul me-1"></i>Détail par acte
                                </Button>
                                <Button
                                    size="sm"
                                    variant={mode === 'famille' ? 'primary' : 'outline-primary'}
                                    onClick={() => setMode('famille')}
                                >
                                    <i className="bi bi-collection me-1"></i>Par famille
                                </Button>
                            </ButtonGroup>
                        </Col>
                        <Col md={2}>
                            <Button variant="success" className="w-100" onClick={() => charger()} disabled={loading}>
                                <i className="bi bi-funnel-fill me-1"></i>Générer
                            </Button>
                        </Col>
                        <Col md={1}>
                            <Button variant="outline-secondary" className="w-100" onClick={() => {
                                setDateDebut(thirtyDaysAgo());
                                setDateFin(todayIso());
                            }}>
                                <i className="bi bi-x-circle"></i>
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="success" style={{ width: 48, height: 48 }} />
                    <p className="mt-3 text-muted">Génération du relevé...</p>
                </div>
            )}

            {!loading && data && (
                <>
                    {/* Totaux */}
                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <Card className="border-0 shadow-sm text-center h-100">
                                <Card.Body className="py-3">
                                    <div className="text-muted small mb-1">Montant total encaissé</div>
                                    <div className="fw-bold fs-4 text-success">{fmtMontant(data.totaux.montantTotal)}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm text-center h-100">
                                <Card.Body className="py-3">
                                    <div className="text-muted small mb-1">Nombre de prescriptions payées</div>
                                    <div className="fw-bold fs-4 text-primary">{fmt(data.totaux.nombreTotal)}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm text-center h-100">
                                <Card.Body className="py-3">
                                    <div className="text-muted small mb-1">Lignes ({mode === 'famille' ? 'familles' : 'actes'})</div>
                                    <div className="fw-bold fs-4 text-info">{fmt(data.lignes.length)}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Graphique */}
                    {data.lignes.length > 0 && (
                        <Card className="border-0 shadow-sm mb-4 no-print">
                            <Card.Header className="bg-white border-0 pb-0">
                                <h6 className="fw-bold mb-0">
                                    <i className="bi bi-bar-chart-fill me-2 text-success"></i>
                                    {mode === 'famille' ? 'Montant par famille biologique' : 'Top actes biologiques'}
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={data.lignes.slice(0, 12)}
                                        layout="vertical"
                                        margin={{ left: 10, right: 30 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11 }}
                                            tickFormatter={v => fmt(v)}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            tick={{ fontSize: 10 }}
                                            width={160}
                                        />
                                        <Tooltip
                                            formatter={(v: any) => fmtMontant(v)}
                                            labelStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="montant" name="Montant" radius={[0, 4, 4, 0]}>
                                            {data.lignes.slice(0, 12).map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Tableau relevé */}
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-table me-2 text-success"></i>
                                Relevé {mode === 'famille' ? 'par famille' : 'détaillé par acte'}
                            </h6>
                            <small className="text-muted">
                                Période : {new Date(dateDebut).toLocaleDateString('fr-FR')} → {new Date(dateFin).toLocaleDateString('fr-FR')}
                            </small>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive bordered className="mb-0 small">
                                <thead className="table-success">
                                    <tr>
                                        <th style={{ width: 40 }}>#</th>
                                        <th>{mode === 'famille' ? 'Famille biologique' : 'Désignation de l\'acte'}</th>
                                        {mode === 'acte' && <th>Famille</th>}
                                        <th className="text-end">Montant (FCFA)</th>
                                        <th className="text-center" style={{ width: 130 }}>% Montant</th>
                                        <th className="text-center">Nbre Presc.</th>
                                        <th className="text-center" style={{ width: 130 }}>% Nombre</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.lignes.length === 0 ? (
                                        <tr>
                                            <td colSpan={mode === 'acte' ? 7 : 6} className="text-center text-muted py-4">
                                                Aucune prestation payée sur cette période.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.lignes.map((l, i) => (
                                            <tr key={i}>
                                                <td className="text-muted">{i + 1}</td>
                                                <td className="fw-semibold">{l.label}</td>
                                                {mode === 'acte' && (
                                                    <td>
                                                        {l.famille
                                                            ? <Badge bg="light" text="dark" className="border">{l.famille}</Badge>
                                                            : <span className="text-muted">—</span>}
                                                    </td>
                                                )}
                                                <td className="text-end fw-bold">{fmtMontant(l.montant)}</td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center gap-1">
                                                        <ProgressBar
                                                            now={l.pourcentageMontant}
                                                            style={{ height: 8, flex: 1 }}
                                                            variant="success"
                                                        />
                                                        <small>{fmtPct(l.pourcentageMontant)}</small>
                                                    </div>
                                                </td>
                                                <td className="text-center">{fmt(l.nombre)}</td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center gap-1">
                                                        <ProgressBar
                                                            now={l.pourcentageNombre}
                                                            style={{ height: 8, flex: 1 }}
                                                            variant="primary"
                                                        />
                                                        <small>{fmtPct(l.pourcentageNombre)}</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {data.lignes.length > 0 && (
                                    <tfoot className="table-light fw-bold">
                                        <tr>
                                            <td colSpan={mode === 'acte' ? 3 : 2} className="text-end">TOTAL</td>
                                            <td className="text-end text-success">{fmtMontant(data.totaux.montantTotal)}</td>
                                            <td className="text-center">100,00 %</td>
                                            <td className="text-center">{fmt(data.totaux.nombreTotal)}</td>
                                            <td className="text-center">100,00 %</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </Table>
                        </Card.Body>
                    </Card>
                </>
            )}

            {!loading && !data && (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-receipt fs-1 d-block mb-3 opacity-25"></i>
                    <p>Définissez une période et cliquez sur <strong>Générer</strong> pour afficher le relevé.</p>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media print {
                    .no-print { display: none !important; }
                    .sidebar-medical, .sidebar-burger-medical { display: none !important; }
                }
            `}</style>
        </Container>
    );
}
