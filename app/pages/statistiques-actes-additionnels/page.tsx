"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Container, Form, Row, Spinner, Table, Badge } from 'react-bootstrap';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';
import { useEntreprise } from '@/hooks/useEntreprise';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip as ReTooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

interface Totals {
    consultations: number;
    lignes: number;
    qte: number;
    montant: number;
    partPatient: number;
    partAssurance: number;
    actesDistincts: number;
    moyenneParConsultation: number;
}

interface ActeItem {
    idActe: string;
    designation: string;
    qte: number;
    montant: number;
    nbConsultations: number;
}

interface JourItem {
    jour: string;
    qte: number;
    montant: number;
    lignes: number;
}

interface MedecinItem {
    nom: string;
    qte: number;
    montant: number;
    consultations: number;
}

interface DetailItem {
    consultationId: string;
    codePrestation: string;
    date: string;
    patient: string;
    codeDossier: string;
    medecin: string;
    caissiere: string;
    designation: string;
    qte: number;
    montant: number;
    partPatient: number;
    facture: boolean;
}

interface StatsData {
    totals: Totals;
    parActe: ActeItem[];
    parJour: JourItem[];
    parMedecin: MedecinItem[];
    details: DetailItem[];
}

const PIE_COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');

export default function StatistiquesActesAdditionnelsPage() {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [search, setSearch] = useState('');

    const { entreprise } = useEntreprise();

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams();
            if (dateDebut) params.append('dateDebut', dateDebut);
            if (dateFin) params.append('dateFin', dateFin);
            const res = await fetch(`/api/statistiques/actes-additionnels?${params.toString()}`);
            if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
            setData(await res.json());
        } catch (err: any) {
            setError(err.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [dateDebut, dateFin]);

    const kpis = useMemo(() => {
        const t = data?.totals;
        return [
            { label: 'Montant total', value: `${fmt(t?.montant || 0)} F`, icon: 'bi-cash-stack', color: 'success' },
            { label: 'Part patient', value: `${fmt(t?.partPatient || 0)} F`, icon: 'bi-person-wallet', color: 'primary' },
            { label: 'Actes facturés', value: t?.lignes || 0, icon: 'bi-list-check', color: 'info' },
            { label: 'Quantité totale', value: t?.qte || 0, icon: 'bi-plus-square', color: 'warning' },
            { label: 'Consultations concernées', value: t?.consultations || 0, icon: 'bi-clipboard2-pulse', color: 'secondary' },
            { label: 'Actes distincts', value: t?.actesDistincts || 0, icon: 'bi-collection', color: 'danger' },
            { label: 'Moyenne / consultation', value: `${fmt(t?.moyenneParConsultation || 0)} F`, icon: 'bi-graph-up-arrow', color: 'primary' },
        ];
    }, [data]);

    const pieData = useMemo(() => {
        const actes = data?.parActe || [];
        const top = actes.slice(0, 8).map((a) => ({ label: a.designation, value: a.montant }));
        const autres = actes.slice(8).reduce((s, a) => s + a.montant, 0);
        if (autres > 0) top.push({ label: 'Autres', value: autres });
        return top;
    }, [data]);

    const filteredDetails = useMemo(() => {
        const d = data?.details || [];
        if (!search) return d;
        const s = search.toLowerCase();
        return d.filter((l) =>
            l.patient.toLowerCase().includes(s) ||
            l.designation.toLowerCase().includes(s) ||
            l.medecin.toLowerCase().includes(s) ||
            l.codeDossier.toLowerCase().includes(s) ||
            l.codePrestation.toLowerCase().includes(s)
        );
    }, [data, search]);

    const handlePrintDetails = () => {
        const headerHTML = generatePrintHeader(entreprise);
        const footerHTML = generatePrintFooter(entreprise);
        const periode = `Période : ${dateDebut || 'début'} → ${dateFin || 'aujourd\'hui'}`;
        const rows = filteredDetails.map((l) => `
            <tr>
                <td>${l.date}</td>
                <td>${l.patient}</td>
                <td>${l.codeDossier}</td>
                <td>${l.designation}</td>
                <td style="text-align:center">${l.qte}</td>
                <td style="text-align:right">${fmt(l.montant)}</td>
                <td>${l.medecin}</td>
                <td>${l.facture ? 'Facturé' : 'En attente'}</td>
            </tr>
        `).join('');

        const contentHTML = `
            <div class="sub-header">STATISTIQUES — ACTES ADDITIONNELS DE CONSULTATION</div>
            <p>${periode}</p>
            <p><b>Total : ${fmt(filteredDetails.reduce((s, l) => s + l.montant, 0))} FCFA</b> — ${filteredDetails.length} ligne(s), ${filteredDetails.reduce((s, l) => s + l.qte, 0)} acte(s)</p>
            <table>
                <thead>
                    <tr>
                        <th>Date</th><th>Patient</th><th>Dossier</th><th>Acte</th>
                        <th>Qté</th><th>Montant</th><th>Médecin</th><th>Statut</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="text-center mt-4">
                <span class="fw-bold">Merci pour votre confiance</span><br/>
                <small>Imprimé le ${new Date().toLocaleString('fr-FR')}</small>
            </div>
        `;
        createPrintWindow('Statistiques actes additionnels', headerHTML, contentHTML, footerHTML);
    };

    return (
        <Container fluid className="py-3">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h3 className="fw-bold text-primary m-0">
                    <i className="bi bi-clipboard2-data me-2"></i>
                    Statistiques — Actes additionnels
                </h3>
                <button className="btn btn-outline-primary" onClick={handlePrintDetails} disabled={!filteredDetails.length}>
                    <i className="bi bi-printer me-2"></i>Imprimer la liste
                </button>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label>Date début</Form.Label>
                            <Form.Control type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                        </Col>
                        <Col md={4}>
                            <Form.Label>Date fin</Form.Label>
                            <Form.Control type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                        </Col>
                        <Col md={4}>
                            <button className="btn btn-primary w-100" onClick={fetchStats} disabled={loading}>
                                {loading ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-arrow-clockwise me-2"></i>Actualiser</>}
                            </button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <div className="alert alert-danger">{error}</div>}

            <Row className="g-3 mb-4">
                {kpis.map((kpi, idx) => (
                    <Col key={idx} xs={12} sm={6} md={4} lg={3}>
                        <Card className={`border-0 shadow-sm h-100 border-start border-4 border-${kpi.color}`}>
                            <Card.Body className="d-flex align-items-center p-3">
                                <div className={`bg-${kpi.color} bg-opacity-10 text-${kpi.color} rounded-3 p-3 me-3 flex-shrink-0`}>
                                    <i className={`bi ${kpi.icon} fs-4`}></i>
                                </div>
                                <div className="flex-grow-1 min-w-0">
                                    <h5 className={`fw-bold text-${kpi.color} mb-0 text-truncate`}>{kpi.value}</h5>
                                    <small className="text-muted text-truncate d-block">{kpi.label}</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4 mb-4">
                <Col lg={7}>
                    <Card className="border-0 shadow-sm h-100 overflow-hidden">
                        <Card.Header className="bg-white border-bottom-0 pt-3">
                            <h6 className="fw-bold">Top actes additionnels (par montant)</h6>
                        </Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={(data?.parActe || []).slice(0, 10)} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 11 }} />
                                    <YAxis
                                        dataKey="designation"
                                        type="category"
                                        width={170}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v: string) => (v.length > 24 ? `${v.substring(0, 24)}...` : v)}
                                    />
                                    <ReTooltip formatter={(v: any) => `${fmt(Number(v))} FCFA`} />
                                    <Bar dataKey="montant" name="Montant" fill="#0d6efd" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="border-0 shadow-sm h-100 overflow-hidden">
                        <Card.Header className="bg-white border-bottom-0 pt-3">
                            <h6 className="fw-bold">Répartition du chiffre par acte</h6>
                        </Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="label"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ReTooltip formatter={(v: any) => `${fmt(Number(v))} FCFA`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 mb-4">
                <Col lg={7}>
                    <Card className="border-0 shadow-sm h-100 overflow-hidden">
                        <Card.Header className="bg-white border-bottom-0 pt-3">
                            <h6 className="fw-bold">Évolution journalière (montant)</h6>
                        </Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data?.parJour || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 11 }} />
                                    <ReTooltip formatter={(v: any) => `${fmt(Number(v))} FCFA`} />
                                    <Bar dataKey="montant" name="Montant" fill="#198754" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="border-0 shadow-sm h-100 overflow-hidden">
                        <Card.Header className="bg-white border-bottom-0 pt-3">
                            <h6 className="fw-bold">Par médecin prescripteur</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover size="sm" className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-3">Médecin</th>
                                        <th className="text-center">Actes</th>
                                        <th className="text-end pe-3">Montant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.parMedecin || []).length === 0 ? (
                                        <tr><td colSpan={3} className="text-center text-muted py-4">Aucune donnée</td></tr>
                                    ) : (
                                        (data?.parMedecin || []).map((m, i) => (
                                            <tr key={i}>
                                                <td className="ps-3">{m.nom}</td>
                                                <td className="text-center"><Badge bg="info">{m.qte}</Badge></td>
                                                <td className="text-end pe-3 fw-semibold">{fmt(m.montant)} F</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm overflow-hidden mb-4">
                <Card.Header className="bg-white border-bottom-0 pt-3">
                    <h6 className="fw-bold m-0">Statistiques par acte</h6>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: 420, overflowY: 'auto' }}>
                        <Table hover size="sm" className="mb-0 align-middle">
                            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th className="ps-3" style={{ width: 50 }}>#</th>
                                    <th>Acte</th>
                                    <th className="text-center">Nb fois utilisé</th>
                                    <th className="text-center">Qté totale</th>
                                    <th className="text-end">Montant total</th>
                                    <th className="text-end pe-3" style={{ width: 220 }}>Part du CA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.parActe || []).length === 0 ? (
                                    <tr><td colSpan={6} className="text-center text-muted py-4">Aucun acte sur la période</td></tr>
                                ) : (
                                    (data?.parActe || []).map((a, i) => {
                                        const pct = data?.totals.montant ? Math.round((a.montant / data.totals.montant) * 100) : 0;
                                        return (
                                            <tr key={a.idActe || i}>
                                                <td className="ps-3 text-muted">{i + 1}</td>
                                                <td className="fw-semibold">{a.designation}</td>
                                                <td className="text-center"><Badge bg="primary">{a.nbConsultations}</Badge></td>
                                                <td className="text-center"><Badge bg="secondary">{a.qte}</Badge></td>
                                                <td className="text-end fw-semibold">{fmt(a.montant)} F</td>
                                                <td className="pe-3">
                                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: 8, maxWidth: 140 }}>
                                                            <div className="progress-bar bg-success" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                        <span className="small fw-semibold text-muted" style={{ minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {(data?.parActe || []).length > 0 && (
                                <tfoot className="table-light">
                                    <tr>
                                        <td colSpan={2} className="ps-3 fw-bold">Total</td>
                                        <td className="text-center fw-bold">{(data?.parActe || []).reduce((s, a) => s + a.nbConsultations, 0)}</td>
                                        <td className="text-center fw-bold">{data?.totals.qte || 0}</td>
                                        <td className="text-end fw-bold">{fmt(data?.totals.montant || 0)} F</td>
                                        <td className="pe-3"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
                <Card.Header className="bg-white border-bottom-0 pt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h6 className="fw-bold m-0">Détail des actes additionnels facturés</h6>
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Rechercher (patient, acte, médecin, dossier...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: 320 }}
                    />
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: 480, overflowY: 'auto' }}>
                        <Table hover size="sm" className="mb-0 align-middle">
                            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th className="ps-3">Date</th>
                                    <th>Patient</th>
                                    <th>Dossier</th>
                                    <th>Acte</th>
                                    <th className="text-center">Qté</th>
                                    <th className="text-end">Montant</th>
                                    <th>Médecin</th>
                                    <th>Saisi par</th>
                                    <th className="text-center pe-3">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-4"><Spinner animation="border" size="sm" /> Chargement...</td></tr>
                                ) : filteredDetails.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center text-muted py-4">Aucun acte additionnel sur la période</td></tr>
                                ) : (
                                    filteredDetails.map((l, i) => (
                                        <tr key={`${l.consultationId}-${i}`}>
                                            <td className="ps-3">{l.date}</td>
                                            <td>{l.patient}</td>
                                            <td><small className="text-muted">{l.codeDossier}</small></td>
                                            <td className="fw-semibold">{l.designation}</td>
                                            <td className="text-center">{l.qte}</td>
                                            <td className="text-end fw-semibold">{fmt(l.montant)} F</td>
                                            <td>{l.medecin || '-'}</td>
                                            <td><small className="text-muted">{l.caissiere || '-'}</small></td>
                                            <td className="text-center pe-3">
                                                <Badge bg={l.facture ? 'success' : 'warning'} text={l.facture ? 'light' : 'dark'}>
                                                    {l.facture ? 'Facturé' : 'En attente'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredDetails.length > 0 && (
                                <tfoot className="table-light">
                                    <tr>
                                        <td colSpan={4} className="ps-3 fw-bold">Total ({filteredDetails.length} ligne(s))</td>
                                        <td className="text-center fw-bold">{filteredDetails.reduce((s, l) => s + l.qte, 0)}</td>
                                        <td className="text-end fw-bold">{fmt(filteredDetails.reduce((s, l) => s + l.montant, 0))} F</td>
                                        <td colSpan={3}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}
