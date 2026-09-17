"use client";

import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEntreprise } from '@/hooks/useEntreprise';
import { createPrintWindow, generatePrintFooter, generatePrintHeader } from '@/utils/printRecu';

interface Totals { aReceptionner: number; aSaisir: number; retours: number; valides: number; totalJour: number; totalMois: number; totalPeriode: number; resultatsSaisis: number }
interface StatusItem { status: number; label: string; value: number; color: string }
interface MoisItem { mois: string; total: number; valides: number; retours: number }
interface JourItem { jour: string; total: number; aReceptionner: number; aSaisir: number }
interface MedecinItem { medecinId: string; nom: string; total: number; valides: number }
interface TypeItem { type: string; total: number }
interface DetailItem { id: string; patient: string; codeDossier: string; medecin: string; examen: string; date: string | null; statut: number; biologiste: string }
type DetailKey = 'aReceptionner' | 'aSaisir' | 'retours' | 'valides';
interface StatsData {
  totals: Totals; parStatus: StatusItem[]; parMois: MoisItem[]; parJour: JourItem[]; parMedecin: MedecinItem[]; parType: TypeItem[];
  details: Record<DetailKey, DetailItem[]>;
}

const emptyData: StatsData = {
  totals: { aReceptionner: 0, aSaisir: 0, retours: 0, valides: 0, totalJour: 0, totalMois: 0, totalPeriode: 0, resultatsSaisis: 0 },
  parStatus: [], parMois: [], parJour: [], parMedecin: [], parType: [],
  details: { aReceptionner: [], aSaisir: [], retours: [], valides: [] }
};
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const value = new Date(); value.setDate(1); return value.toISOString().slice(0, 10); };
const escapeHtml = (value: unknown) => String(value ?? '-').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));
const statusLabel = (status: number) => ({ 1: 'À réceptionner', 2: 'À saisir', 4: 'Validé', 5: 'Résultat retourné' }[status] || 'Autre');

export default function StatistiquesLaboratoirePage() {
  const [data, setData] = useState<StatsData>(emptyData);
  const [dateDebut, setDateDebut] = useState(monthStart());
  const [dateFin, setDateFin] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailItems, setDetailItems] = useState<DetailItem[]>([]);
  const { entreprise } = useEntreprise();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ dateDebut, dateFin });
      const response = await fetch(`/api/laboratoire/statistiques?${params}`);
      if (!response.ok) throw new Error('Impossible de charger les statistiques du laboratoire');
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [dateDebut, dateFin]);

  const cards = [
    { label: 'À réceptionner', value: data.totals.aReceptionner, icon: 'bi-inbox-fill', color: 'warning', detail: 'aReceptionner' as DetailKey },
    { label: 'À saisir', value: data.totals.aSaisir, icon: 'bi-pencil-square', color: 'info', detail: 'aSaisir' as DetailKey },
    { label: 'Retours de résultats', value: data.totals.retours, icon: 'bi-arrow-return-left', color: 'secondary', detail: 'retours' as DetailKey },
    { label: 'Résultats validés', value: data.totals.valides, icon: 'bi-check-circle-fill', color: 'success', detail: 'valides' as DetailKey },
    { label: 'Examens aujourd’hui', value: data.totals.totalJour, icon: 'bi-calendar-day', color: 'primary' },
    { label: 'Examens ce mois', value: data.totals.totalMois, icon: 'bi-calendar3', color: 'primary' },
    { label: 'Examens sur la période', value: data.totals.totalPeriode, icon: 'bi-clipboard2-pulse', color: 'danger' },
    { label: 'Résultats saisis', value: data.totals.resultatsSaisis, icon: 'bi-file-earmark-medical-fill', color: 'dark' }
  ];
  const topMedecins = useMemo(() => data.parMedecin.slice(0, 10), [data.parMedecin]);

  const openDetail = (key: DetailKey, title: string) => {
    setDetailTitle(title);
    setDetailItems(data.details[key]);
    setShowDetail(true);
  };

  const printDetails = () => {
    const rows = detailItems.map(item => `<tr><td>${escapeHtml(item.patient)}</td><td>${escapeHtml(item.codeDossier)}</td><td>${escapeHtml(item.examen)}</td><td>${escapeHtml(item.medecin)}</td><td>${escapeHtml(item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-')}</td><td>${escapeHtml(statusLabel(item.statut))}</td></tr>`).join('');
    const content = `<div class="sub-header">${escapeHtml(detailTitle.toUpperCase())}</div><table><thead><tr><th>Patient</th><th>Dossier</th><th>Examen</th><th>Prescripteur</th><th>Date</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table><div class="text-center mt-4"><small>Période du ${escapeHtml(new Date(dateDebut).toLocaleDateString('fr-FR'))} au ${escapeHtml(new Date(dateFin).toLocaleDateString('fr-FR'))}</small></div>`;
    createPrintWindow(detailTitle, generatePrintHeader(entreprise), content, generatePrintFooter(entreprise));
  };

  return (
    <Container fluid className="py-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h3 className="fw-bold text-primary m-0"><i className="bi bi-bar-chart-fill me-2" />Statistiques Laboratoire</h3>
        <Badge bg="primary" className="fs-6">Pilotage métier</Badge>
      </div>

      <Card className="border-0 shadow-sm mb-4"><Card.Body><Row className="g-3 align-items-end">
        <Col sm={6} md={4}><Form.Label>Date début</Form.Label><Form.Control type="date" value={dateDebut} max={dateFin} onChange={event => setDateDebut(event.target.value)} /></Col>
        <Col sm={6} md={4}><Form.Label>Date fin</Form.Label><Form.Control type="date" value={dateFin} min={dateDebut} onChange={event => setDateFin(event.target.value)} /></Col>
        <Col md={4}><Button className="w-100" onClick={fetchStats} disabled={loading}>{loading ? <Spinner size="sm" /> : <><i className="bi bi-arrow-clockwise me-2" />Actualiser</>}</Button></Col>
      </Row></Card.Body></Card>

      {error && <div className="alert alert-danger">{error}</div>}
      <Row className="g-3 mb-4">{cards.map(card => <Col key={card.label} xs={12} sm={6} md={4} xl={3}>
        <Card className={`border-0 shadow-sm h-100 border-start border-4 border-${card.color}`}><Card.Body className="d-flex align-items-center p-3">
          <div className={`bg-${card.color} bg-opacity-10 text-${card.color} rounded-3 p-3 me-3`}><i className={`bi ${card.icon} fs-4`} /></div>
          <div className="flex-grow-1"><h5 className={`fw-bold text-${card.color} mb-0`}>{card.value.toLocaleString('fr-FR')}</h5><small className="text-muted">{card.label}</small></div>
          {card.detail && <Button variant="link" size="sm" title="Voir les détails" onClick={() => openDetail(card.detail, card.label)}><i className="bi bi-box-arrow-up-right" /></Button>}
        </Card.Body></Card>
      </Col>)}</Row>

      <Row className="g-4 mb-4">
        <Col lg={4}><Card className="border-0 shadow-sm h-100"><Card.Header className="bg-white border-0 pt-3"><h6 className="fw-bold">Répartition par statut</h6></Card.Header><Card.Body><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={data.parStatus.filter(item => item.value > 0)} dataKey="value" nameKey="label" outerRadius={90} label>{data.parStatus.map(item => <Cell key={item.status} fill={item.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></Card.Body></Card></Col>
        <Col lg={8}><Card className="border-0 shadow-sm h-100"><Card.Header className="bg-white border-0 pt-3"><h6 className="fw-bold">Évolution mensuelle</h6></Card.Header><Card.Body><ResponsiveContainer width="100%" height={300}><LineChart data={data.parMois}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="total" name="Examens" stroke="#0d6efd" strokeWidth={2} /><Line type="monotone" dataKey="valides" name="Validés" stroke="#198754" strokeWidth={2} /><Line type="monotone" dataKey="retours" name="Retours" stroke="#6f42c1" strokeWidth={2} /></LineChart></ResponsiveContainer></Card.Body></Card></Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={6}><Card className="border-0 shadow-sm h-100"><Card.Header className="bg-white border-0 pt-3"><h6 className="fw-bold">Top prescripteurs / médecins</h6></Card.Header><Card.Body><ResponsiveContainer width="100%" height={340}><BarChart data={topMedecins} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="nom" width={130} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="total" name="Examens prescrits" fill="#0d6efd" /><Bar dataKey="valides" name="Validés" fill="#198754" /></BarChart></ResponsiveContainer></Card.Body></Card></Col>
        <Col lg={6}><Card className="border-0 shadow-sm h-100"><Card.Header className="bg-white border-0 pt-3"><h6 className="fw-bold">Répartition par type d’examen / biochimie</h6></Card.Header><Card.Body><ResponsiveContainer width="100%" height={340}><BarChart data={data.parType} margin={{ bottom: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="total" name="Examens" fill="#0dcaf0" /></BarChart></ResponsiveContainer></Card.Body></Card></Col>
      </Row>

      <Card className="border-0 shadow-sm"><Card.Header className="bg-white border-0 pt-3"><h6 className="fw-bold">Volume quotidien</h6></Card.Header><Card.Body><ResponsiveContainer width="100%" height={300}><BarChart data={data.parJour}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="jour" angle={-35} textAnchor="end" height={65} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="total" name="Total" fill="#0d6efd" /><Bar dataKey="aReceptionner" name="À réceptionner" fill="#ffc107" /><Bar dataKey="aSaisir" name="À saisir" fill="#0dcaf0" /></BarChart></ResponsiveContainer></Card.Body></Card>

      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl" fullscreen="lg-down"><Modal.Header closeButton><Modal.Title><i className="bi bi-list-check me-2" />{detailTitle}</Modal.Title></Modal.Header><Modal.Body>
        {detailItems.length === 0 ? <div className="text-center text-muted py-5">Aucun examen trouvé.</div> : <Table striped bordered hover responsive size="sm"><thead className="table-primary"><tr><th>#</th><th>Patient</th><th>Dossier</th><th>Examen</th><th>Prescripteur</th><th>Date</th><th>Statut</th></tr></thead><tbody>{detailItems.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.patient}</td><td>{item.codeDossier}</td><td>{item.examen}</td><td>{item.medecin}</td><td>{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-'}</td><td><Badge bg={item.statut === 4 ? 'success' : item.statut === 5 ? 'secondary' : 'warning'}>{statusLabel(item.statut)}</Badge></td></tr>)}</tbody></Table>}
      </Modal.Body><Modal.Footer><Button onClick={printDetails} disabled={!detailItems.length}><i className="bi bi-printer me-2" />Imprimer</Button><Button variant="secondary" onClick={() => setShowDetail(false)}>Fermer</Button></Modal.Footer></Modal>
    </Container>
  );
}
