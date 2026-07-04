'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    Alert, Badge, Button, ButtonGroup, Card, Col, Container,
    Form, ProgressBar, Row, Spinner, Table
} from 'react-bootstrap';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const todayIso = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR');
const fmtMontant = (n: number) => `${fmt(n)} FCFA`;
const fmtPct = (n: number) => `${Number(n || 0).toFixed(2)} %`;

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1', '#fd7e14', '#20c997'];

interface KPIs {
    totalExamens: number; examensEnAttente: number; examensValides: number;
    examensRetournes: number; patients: number; montantTotal: number;
    resultatsSaisis: number; tauxValidation: number;
}
interface StatsData {
    kpis: KPIs;
    topExamens: { prestation: string; total: number; montant: number }[];
    repartitionSexe: { sexe: string; total: number }[];
    examensFamilleActe: { famille: string; total: number; montant: number }[];
    evolutionJournaliere: { date: string; recus: number; valides: number }[];
}
interface LigneReleve {
    label: string; famille?: string;
    montant: number; pourcentageMontant: number;
    nombre: number; pourcentageNombre: number;
}
interface ReleveData {
    totaux: { montantTotal: number; nombreTotal: number };
    lignes: LigneReleve[];
}

export default function StatistiquesLabo() {
    const [dateDebut, setDateDebut] = useState(thirtyDaysAgo());
    const [dateFin, setDateFin] = useState(todayIso());
    const [data, setData] = useState<StatsData | null>(null);
    const [releve, setReleve] = useState<ReleveData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingReleve, setLoadingReleve] = useState(false);
    const [error, setError] = useState('');
    const [modeReleve, setModeReleve] = useState<'acte' | 'famille'>('acte');

    const chargerStats = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/statistiques/laboratoire?dateDebut=${dateDebut}&dateFin=${dateFin}`);
            if (!res.ok) throw new Error('Erreur chargement statistiques');
            setData(await res.json());
        } catch (err: any) {
            setError(err.message || 'Erreur serveur');
        } finally {
            setLoading(false);
        }
    }, [dateDebut, dateFin]);

    const chargerReleve = useCallback(async (mode: 'acte' | 'famille') => {
        try {
            setLoadingReleve(true);
            const res = await fetch(`/api/statistiques/releveCompte?dateDebut=${dateDebut}&dateFin=${dateFin}&mode=${mode}`);
            if (!res.ok) throw new Error('Erreur chargement relevé');
            setReleve(await res.json());
        } catch {
            // silencieux, les stats restent visibles
        } finally {
            setLoadingReleve(false);
        }
    }, [dateDebut, dateFin]);

    const chargerTout = useCallback(async () => {
        await Promise.all([chargerStats(), chargerReleve(modeReleve)]);
    }, [chargerStats, chargerReleve, modeReleve]);

    useEffect(() => { chargerTout(); }, []);

    const handleModeReleve = (m: 'acte' | 'famille') => {
        setModeReleve(m);
        chargerReleve(m);
    };

    const kpiCards = data ? [
        { label: 'Total Examens', value: fmt(data.kpis.totalExamens), icon: 'bi-clipboard2-pulse-fill', bg: '#0d6efd' },
        { label: 'Patients', value: fmt(data.kpis.patients), icon: 'bi-person-fill', bg: '#198754' },
        { label: 'Résultats Saisis', value: fmt(data.kpis.resultatsSaisis), icon: 'bi-pencil-fill', bg: '#6f42c1' },
        { label: 'Examens Validés', value: fmt(data.kpis.examensValides), icon: 'bi-check-circle-fill', bg: '#0dcaf0' },
        { label: 'En Attente', value: fmt(data.kpis.examensEnAttente), icon: 'bi-hourglass-split', bg: '#fd7e14' },
        { label: 'Montant Encaissé', value: fmtMontant(data.kpis.montantTotal), icon: 'bi-cash-stack', bg: '#198754' },
    ] : [];

    return (
        <Container fluid className="py-4 px-3 stats-page" style={{ background: '#f8f9fa', minHeight: '100vh' }}>

            {/* ── En-tête ── */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 no-print">
                <div>
                    <Badge bg="primary" className="mb-1">Laboratoire</Badge>
                    <h4 className="fw-bold mb-0">
                        <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
                        Statistiques &amp; Relevé de Compte — Biologie
                    </h4>
                    <small className="text-muted">Tableau de bord analytique · Actes biologiques</small>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => window.print()} disabled={!data}>
                        <i className="bi bi-printer me-1"></i>Imprimer
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={chargerTout} disabled={loading}>
                        <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* En-tête impression uniquement */}
            <div className="print-only mb-3">
                <h4 className="fw-bold text-center">Statistiques Laboratoire — Relevé de Compte Biologie</h4>
                <p className="text-center text-muted small mb-0">
                    Période : {new Date(dateDebut).toLocaleDateString('fr-FR')} → {new Date(dateFin).toLocaleDateString('fr-FR')}
                    &nbsp;·&nbsp; Imprimé le {new Date().toLocaleDateString('fr-FR')}
                </p>
                <hr />
            </div>

            {/* ── Filtres ── */}
            <Card className="border-0 shadow-sm mb-4 no-print">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3} sm={6}>
                            <Form.Label className="fw-semibold small">Date début</Form.Label>
                            <Form.Control type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
                        </Col>
                        <Col md={3} sm={6}>
                            <Form.Label className="fw-semibold small">Date fin</Form.Label>
                            <Form.Control type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
                        </Col>
                        <Col md={2}>
                            <Button variant="primary" className="w-100" onClick={chargerTout} disabled={loading}>
                                <i className="bi bi-funnel-fill me-1"></i>Filtrer
                            </Button>
                        </Col>
                        <Col md={2}>
                            <Button variant="outline-secondary" className="w-100" onClick={() => {
                                setDateDebut(thirtyDaysAgo());
                                setDateFin(todayIso());
                            }}>
                                <i className="bi bi-x-circle me-1"></i>Réinitialiser
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            {loading && (
                <div className="text-center py-5 no-print">
                    <Spinner animation="border" variant="primary" style={{ width: 48, height: 48 }} />
                    <p className="mt-3 text-muted">Chargement...</p>
                </div>
            )}

            {!loading && data && (
                <>
                    {/* ══ SECTION 1 : KPIs ══ */}
                    <Row className="g-3 mb-4">
                        {kpiCards.map((k, i) => (
                            <Col key={i} xl={2} md={4} sm={6}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="d-flex align-items-center gap-3">
                                        <div className="rounded-3 d-flex align-items-center justify-content-center"
                                            style={{ width: 44, height: 44, background: `${k.bg}20`, flexShrink: 0 }}>
                                            <i className={`bi ${k.icon} fs-5`} style={{ color: k.bg }}></i>
                                        </div>
                                        <div>
                                            <div className="text-muted small">{k.label}</div>
                                            <div className="fw-bold">{k.value}</div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* ══ SECTION 2 : Taux de validation ══ */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">
                                    <i className="bi bi-check2-all me-1 text-success"></i>
                                    Taux de validation des examens
                                </span>
                                <Badge bg={data.kpis.tauxValidation >= 80 ? 'success' : data.kpis.tauxValidation >= 50 ? 'warning' : 'danger'}>
                                    {data.kpis.tauxValidation}%
                                </Badge>
                            </div>
                            <ProgressBar now={data.kpis.tauxValidation}
                                variant={data.kpis.tauxValidation >= 80 ? 'success' : data.kpis.tauxValidation >= 50 ? 'warning' : 'danger'}
                                style={{ height: 12, borderRadius: 8 }} />
                            <Row className="mt-2 text-center">
                                <Col><small className="text-muted">Validés : <strong className="text-success">{fmt(data.kpis.examensValides)}</strong></small></Col>
                                <Col><small className="text-muted">En attente : <strong className="text-warning">{fmt(data.kpis.examensEnAttente)}</strong></small></Col>
                                <Col><small className="text-muted">Retournés : <strong className="text-danger">{fmt(data.kpis.examensRetournes)}</strong></small></Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* ══ SECTION 3 : Graphiques (masqués à l'impression) ══ */}
                    <div className="no-print">
                        <Row className="g-4 mb-4">
                            <Col xl={8} lg={12}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Header className="bg-white border-0 pb-0">
                                        <h6 className="fw-bold mb-0"><i className="bi bi-graph-up me-2 text-primary"></i>Évolution journalière</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <LineChart data={data.evolutionJournaliere}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="recus" name="Reçus" stroke="#0d6efd" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="valides" name="Validés" stroke="#198754" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xl={4} lg={6}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Header className="bg-white border-0 pb-0">
                                        <h6 className="fw-bold mb-0"><i className="bi bi-gender-ambiguous me-2 text-info"></i>Répartition par sexe</h6>
                                    </Card.Header>
                                    <Card.Body className="d-flex align-items-center justify-content-center">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={data.repartitionSexe} dataKey="total" nameKey="sexe"
                                                    cx="50%" cy="50%" outerRadius={80}
                                                    label={({ name, percent }: any) => `${name === 'M' ? 'H' : name === 'F' ? 'F' : name} ${((percent || 0) * 100).toFixed(0)}%`}>
                                                    {data.repartitionSexe.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(v: any) => fmt(v)} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Row className="g-4 mb-4">
                            <Col xl={6} lg={12}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Header className="bg-white border-0 pb-0">
                                        <h6 className="fw-bold mb-0"><i className="bi bi-trophy-fill me-2 text-warning"></i>Top 10 examens demandés</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={data.topExamens} layout="vertical" margin={{ left: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                                <YAxis type="category" dataKey="prestation" tick={{ fontSize: 10 }} width={140} />
                                                <Tooltip formatter={(v: any) => fmt(v)} />
                                                <Bar dataKey="total" name="Quantité" fill="#0d6efd" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xl={6} lg={12}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Header className="bg-white border-0 pb-0">
                                        <h6 className="fw-bold mb-0"><i className="bi bi-collection-fill me-2 text-success"></i>Examens par famille biologique</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={data.examensFamilleActe}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="famille" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                                <Tooltip formatter={(v: any) => fmt(v)} />
                                                <Legend />
                                                <Bar dataKey="total" name="Quantité" radius={[4, 4, 0, 0]}>
                                                    {data.examensFamilleActe.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* ══ SECTION 4 : Relevé de compte ══ */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-receipt me-2 text-success"></i>
                                Relevé de Compte — Actes Biologiques Payés
                            </h6>
                            <div className="d-flex gap-2 no-print">
                                <ButtonGroup size="sm">
                                    <Button variant={modeReleve === 'acte' ? 'success' : 'outline-success'}
                                        onClick={() => handleModeReleve('acte')}>
                                        <i className="bi bi-list-ul me-1"></i>Par acte
                                    </Button>
                                    <Button variant={modeReleve === 'famille' ? 'success' : 'outline-success'}
                                        onClick={() => handleModeReleve('famille')}>
                                        <i className="bi bi-collection me-1"></i>Par famille
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </Card.Header>

                        {releve && (
                            <div className="px-3 py-2 border-bottom bg-light d-flex gap-4 flex-wrap">
                                <span className="small">
                                    <strong className="text-success">{fmtMontant(releve.totaux.montantTotal)}</strong>
                                    <span className="text-muted ms-1">encaissé</span>
                                </span>
                                <span className="small">
                                    <strong className="text-primary">{fmt(releve.totaux.nombreTotal)}</strong>
                                    <span className="text-muted ms-1">prescriptions</span>
                                </span>
                                <span className="small text-muted print-only">
                                    Vue : {modeReleve === 'famille' ? 'Par famille' : 'Détail par acte'}
                                </span>
                            </div>
                        )}

                        <Card.Body className="p-0">
                            {loadingReleve ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="success" size="sm" className="me-2" />
                                    <span className="text-muted small">Chargement du relevé...</span>
                                </div>
                            ) : (
                                <Table hover responsive bordered className="mb-0 small">
                                    <thead className="table-success">
                                        <tr>
                                            <th style={{ width: 36 }}>#</th>
                                            <th>{modeReleve === 'famille' ? 'Famille biologique' : 'Désignation de l\'acte'}</th>
                                            {modeReleve === 'acte' && <th>Famille</th>}
                                            <th className="text-end">Montant (FCFA)</th>
                                            <th className="text-center" style={{ width: 130 }}>% Montant</th>
                                            <th className="text-center">Nbre</th>
                                            <th className="text-center" style={{ width: 130 }}>% Nbre</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!releve || releve.lignes.length === 0 ? (
                                            <tr>
                                                <td colSpan={modeReleve === 'acte' ? 7 : 6}
                                                    className="text-center text-muted py-4">
                                                    Aucune prestation payée sur cette période.
                                                </td>
                                            </tr>
                                        ) : releve.lignes.map((l, i) => (
                                            <tr key={i}>
                                                <td className="text-muted">{i + 1}</td>
                                                <td className="fw-semibold">{l.label}</td>
                                                {modeReleve === 'acte' && (
                                                    <td>
                                                        {l.famille
                                                            ? <Badge bg="light" text="dark" className="border">{l.famille}</Badge>
                                                            : <span className="text-muted">—</span>}
                                                    </td>
                                                )}
                                                <td className="text-end fw-bold">{fmtMontant(l.montant)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <ProgressBar now={l.pourcentageMontant}
                                                            style={{ height: 8, flex: 1 }} variant="success" className="no-print" />
                                                        <small style={{ whiteSpace: 'nowrap' }}>{fmtPct(l.pourcentageMontant)}</small>
                                                    </div>
                                                </td>
                                                <td className="text-center">{fmt(l.nombre)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <ProgressBar now={l.pourcentageNombre}
                                                            style={{ height: 8, flex: 1 }} variant="primary" className="no-print" />
                                                        <small style={{ whiteSpace: 'nowrap' }}>{fmtPct(l.pourcentageNombre)}</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {releve && releve.lignes.length > 0 && (
                                        <tfoot className="table-light fw-bold">
                                            <tr>
                                                <td colSpan={modeReleve === 'acte' ? 3 : 2} className="text-end">TOTAL</td>
                                                <td className="text-end text-success">{fmtMontant(releve.totaux.montantTotal)}</td>
                                                <td className="text-center">100,00 %</td>
                                                <td className="text-center">{fmt(releve.totaux.nombreTotal)}</td>
                                                <td className="text-center">100,00 %</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .sidebar-medical, .sidebar-burger-medical, .sidebar-overlay-medical { display: none !important; }
                    .stats-page { background: #fff !important; padding: 0 !important; }
                    .card { box-shadow: none !important; border: 1px solid #dee2e6 !important; page-break-inside: avoid; }
                    table { font-size: 11px !important; }
                    thead { background-color: #d1e7dd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    tfoot { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                .print-only { display: none; }
            `}</style>
        </Container>
    );
}
