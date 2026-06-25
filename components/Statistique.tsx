"use client";
import { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Spinner, Alert, Form, Button, ProgressBar, Table, Modal } from "react-bootstrap";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from "@/utils/printRecu";
import { useEntreprise } from "@/hooks/useEntreprise";
import { FaChartLine, FaChartBar, FaChartPie, FaUsers, FaCalendarAlt, FaStethoscope, FaHospital, FaDownload, FaArrowUp, FaArrowDown, FaFileInvoice } from "react-icons/fa";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface StatistiqueData {
  kpis: {
    consultationsJour: number;
    patientsEnAttente: number;
    patientsRecus: number;
    rendezVousJour: number;
    prescriptionsEmises: number;
    examensDemandes: number;
    tauxCompletion: number;
    tempsMoyenConsultation: number;
    caTotal: number;
    nouveauxPatients: number;
    variationNouveauxPatients: number;
  };
  tendances: {
    consultations: number;
    rendezVous: number;
    prescriptions: number;
    examens: number;
  };
  activiteHebdomadaire: { jour: string; consultations: number; rendezVous: number }[];
  evolutionCA: { jour: string; ca: number }[];
  topMedecinsCA: { medecin: string; ca: number; nombre: number }[];
  repartitionActes: { type: string; count: number }[];
  repartitionActesDetail: { medecin: string; famille: string; count: number }[];
  performanceParService: { service: string; total: number; taux: number; statut: "Excellent" | "Correct" | "À surveiller" }[];
  progressionParMedecin: { medecin: string; specialite: string; actuel: number; precedent: number; objectif: number }[];
  progressionParActe: { acte: string; actuel: number; precedent: number; objectif: number }[];
  progressionIndicateurs: { indicateur: string; actuel: number; precedent: number; objectif: number; unite: string }[];
  alertesMetier: { libelle: string; valeur: string; niveau: "success" | "warning" | "danger" | "info" }[];
  actesExamensParMontant: { designation: string; montant: number; nombre: number; details: Record<string, any>[] }[];
  patientsConsultesParMedecin: { medecin: string; nombre: number; totalConsultations: number; details: Record<string, any>[] }[];
  recapMontantParAssurance: { assurance: string; montantExamens: number; montantConsultations: number; montantTotal: number; taux: number; details: Record<string, any>[] }[];
  examensConsultationsParSexe: { sexe: string; consultations: number; examens: number; total: number; details: Record<string, any>[] }[];
  examensBioParSexe: { prestation: string; F: number; M: number; total: number }[];
}

const FAMILLE_COLORS_BASE: { key: string; color: string }[] = [
  { key: 'consultation',         color: '#0d6efd' },
  { key: 'pharmacie',            color: '#198754' },
  { key: 'examen biologique',    color: '#f97316' },
  { key: 'examen hematologique', color: '#fd7e14' },
  { key: 'acte clinique',        color: '#6f42c1' },
  { key: 'radiologie',           color: '#0dcaf0' },
  { key: 'chirurgie',            color: '#dc3545' },
  { key: 'hospitalisation',      color: '#ffc107' },
  { key: 'biochimie',            color: '#20c997' },
];

const getFamilleColorByName = (type: string, fallbackIndex: number, chartColors: string[]): string => {
  const normalized = type.toLowerCase().trim();
  const found = FAMILLE_COLORS_BASE.find(b => normalized.includes(b.key) || b.key.includes(normalized));
  return found?.color ?? chartColors[fallbackIndex % chartColors.length];
};

const RADIAN = Math.PI / 180;
const renderFamilleLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if ((percent || 0) < 0.04) return null;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const lineX1 = cx + (outerRadius + 4) * Math.cos(-midAngle * RADIAN);
  const lineY1 = cy + (outerRadius + 4) * Math.sin(-midAngle * RADIAN);
  const lineX2 = cx + (outerRadius + 18) * Math.cos(-midAngle * RADIAN);
  const lineY2 = cy + (outerRadius + 18) * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? 'start' : 'end';
  const shortName = name.length > 14 ? name.slice(0, 13) + '…' : name;
  return (
    <g>
      <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke="#888" strokeWidth={1} />
      <text x={x} y={y - 5} textAnchor={anchor} fill="#333" fontSize={10} fontWeight={600}>{shortName}</text>
      <text x={x} y={y + 7} textAnchor={anchor} fill="#666" fontSize={10}>{`${((percent || 0) * 100).toFixed(1)}%`}</text>
    </g>
  );
};

function FamilleActeCard({ repartitionActes, chartColors, onPrintDetail }: { repartitionActes: { type: string; count: number }[]; chartColors: string[]; onPrintDetail: () => void }) {
  const [showDetail, setShowDetail] = useState(false);
  const getFamilleColor = (type: string, i: number) => getFamilleColorByName(type, i, chartColors);
  const totalActes = repartitionActes.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <Card className="professional-stat-card border-0 shadow-sm h-100">
      <Card.Header className="professional-stat-header border-0 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaChartPie className="me-2" />
          Répartition par famille d'acte
        </h5>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant={showDetail ? 'secondary' : 'outline-secondary'}
            onClick={() => setShowDetail(v => !v)}
            title="Afficher / Masquer le détail"
          >
            {showDetail ? 'Graphique' : 'Détail'}
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={onPrintDetail}
            title="État imprimable trié par médecin"
          >
            <FaDownload className="me-1" />État
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {!showDetail ? (
          <>
            <ResponsiveContainer width="100%" height={270}>
              <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <Pie
                  data={repartitionActes}
                  dataKey="count"
                  nameKey="type"
                  cx="50%" cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                  label={renderFamilleLabel}
                  labelLine={false}
                >
                  {repartitionActes.map((item, i) => (
                    <Cell key={i} fill={getFamilleColor(item.type, i)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [`${Number(v).toLocaleString('fr-FR')} (${((Number(v) / totalActes) * 100).toFixed(1)}%)`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-1">
              <small className="text-muted">Total : <strong>{totalActes.toLocaleString('fr-FR')}</strong> actes</small>
            </div>
          </>
        ) : (
          <div>
            <Table size="sm" hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Famille</th>
                  <th className="text-end">Nombre</th>
                  <th className="text-end">Part</th>
                </tr>
              </thead>
              <tbody>
                {repartitionActes.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <span className="rounded-2 me-2" style={{ width: 11, height: 11, background: getFamilleColor(item.type, i), display: 'inline-block', verticalAlign: 'middle' }} />
                      <span className="fw-semibold small">{item.type}</span>
                    </td>
                    <td className="text-end fw-bold small">{item.count.toLocaleString('fr-FR')}</td>
                    <td className="text-end">
                      <Badge bg="light" text="dark" style={{ border: `1px solid ${getFamilleColor(item.type, i)}`, color: getFamilleColor(item.type, i) }}>
                        {((item.count / totalActes) * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-secondary fw-bold">
                <tr>
                  <td>Total</td>
                  <td className="text-end">{totalActes.toLocaleString('fr-FR')}</td>
                  <td className="text-end">100%</td>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function Statistique() {
  const { entreprise } = useEntreprise();
  const [data, setData] = useState<StatistiqueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"medecin" | "admin">("medecin");
  const [dateDebut, setDateDebut] = useState(() => new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().slice(0, 10));
  const [detailTitle, setDetailTitle] = useState("");
  const [detailRows, setDetailRows] = useState<Record<string, any>[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRepartitionModal, setShowRepartitionModal] = useState(false);
  const [showAssuranceModal, setShowAssuranceModal] = useState(false);
  const [showSexeModal, setShowSexeModal] = useState(false);
  const [showBioSexeModal, setShowBioSexeModal] = useState(false);

  useEffect(() => {
    // Détecter le rôle de l'utilisateur
    const userRole = localStorage.getItem("userRole") || "medecin";
    setViewMode(userRole as "medecin" | "admin");
    
    loadStatistiques();
  }, []);

  const loadStatistiques = async () => {
    setLoading(true);
    setError("");
     
    try {
      const profilStr = localStorage.getItem("profil");
      const profil = profilStr ? JSON.parse(profilStr) : null;
      const params = new URLSearchParams();

      if (profil?._id) {
        params.set("profilId", profil._id);
      }

      if (profil?.nom) {
        params.set("nom", profil.nom);
      }

      if (profil?.prenom) {
        params.set("prenom", profil.prenom);
      }

      params.set("dateDebut", dateDebut);
      params.set("dateFin", dateFin);

      const response = await fetch(`/api/statistiques-medecin?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erreur lors du chargement des statistiques");
      }

      const statistiques: StatistiqueData = await response.json();
      setData(statistiques);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (value: number) => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;

  const afficherDetails = (title: string, rows: Record<string, any>[] = []) => {
    setDetailTitle(title);
    setDetailRows(rows);
    setShowDetailModal(true);
  };

  const fermerDetails = () => {
    setShowDetailModal(false);
    setDetailTitle("");
    setDetailRows([]);
  };

  const totalMontantsActes = data?.actesExamensParMontant.reduce((sum, item) => sum + item.montant, 0) || 0;
  const totalPatientsConsultes = data?.patientsConsultesParMedecin.reduce((sum, item) => sum + item.nombre, 0) || 0;
  const totalAssurances = data?.recapMontantParAssurance.reduce((sum, item) => sum + item.montantTotal, 0) || 0;

  const CHART_COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1', '#fd7e14', '#20c997'];

  const calculerProgression = (actuel: number, precedent: number) => {
    if (precedent === 0) return actuel > 0 ? 100 : 0;
    return ((actuel - precedent) / precedent) * 100;
  };

  const calculerMargeObjectif = (actuel: number, objectif: number) => {
    if (objectif === 0) return 0;
    return ((objectif - actuel) / objectif) * 100;
  };

  const getProgressionVariant = (progression: number) => {
    if (progression >= 10) return "success";
    if (progression >= 0) return "info";
    return "danger";
  };

  const getObjectifVariant = (actuel: number, objectif: number) => {
    const tauxAtteinte = objectif === 0 ? 0 : (actuel / objectif) * 100;
    if (tauxAtteinte >= 90) return "success";
    if (tauxAtteinte >= 70) return "warning";
    return "danger";
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!data) return null;

  return (
    <div className="statistique-container">
      <div className="stats-hero d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="stats-eyebrow">Easy Medical Analytics</span>
          <h2 className="mb-1">
            <FaChartLine className="me-2" />
            Statistiques métier {viewMode === "admin" ? "administrateur" : "médecin"}
          </h2>
          <p className="mb-0">
            Pilotage professionnel de l'activité médicale, des consultations et du suivi patient
          </p>
        </div>
        <div className="stats-filter-panel d-flex gap-3">
          <Form.Group className="mb-0">
            <Form.Label>Début</Form.Label>
            <Form.Control type="date" size="sm" value={dateDebut} onChange={(event) => setDateDebut(event.target.value)} />
          </Form.Group>
          <Form.Group className="mb-0">
            <Form.Label>Fin</Form.Label>
            <Form.Control type="date" size="sm" value={dateFin} onChange={(event) => setDateFin(event.target.value)} />
          </Form.Group>
          <Button variant="primary" size="sm" onClick={loadStatistiques} disabled={loading}>Actualiser</Button>
          <Button variant="outline-primary" size="sm" disabled>
            <FaDownload className="me-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* ── KPI Row 1 ── */}
      <Row className="g-4 mb-3">
        {[
          { icon: <FaStethoscope />, color: '#0d6efd', value: data.kpis.consultationsJour, label: 'Consultations', trend: `${data.tendances.consultations > 0 ? '+' : ''}${data.tendances.consultations}%`, up: data.tendances.consultations >= 0 },
          { icon: <FaUsers />, color: '#f97316', value: data.kpis.patientsEnAttente, label: 'En attente', trend: 'File active', up: true },
          { icon: <FaCalendarAlt />, color: '#198754', value: data.kpis.rendezVousJour, label: 'Rendez-vous', trend: `${data.tendances.rendezVous > 0 ? '+' : ''}${data.tendances.rendezVous}%`, up: data.tendances.rendezVous >= 0 },
          { icon: <FaFileInvoice />, color: '#0dcaf0', value: data.kpis.prescriptionsEmises, label: 'Prescriptions', trend: `${data.tendances.prescriptions > 0 ? '+' : ''}${data.tendances.prescriptions}%`, up: data.tendances.prescriptions >= 0 },
          { icon: <FaHospital />, color: '#6f42c1', value: data.kpis.examensDemandes, label: 'Examens demandés', trend: `${data.tendances.examens > 0 ? '+' : ''}${data.tendances.examens}%`, up: data.tendances.examens >= 0 },
          { icon: <FaUsers />, color: '#20c997', value: data.kpis.nouveauxPatients, label: 'Nouveaux patients', trend: `${data.kpis.variationNouveauxPatients > 0 ? '+' : ''}${data.kpis.variationNouveauxPatients}%`, up: data.kpis.variationNouveauxPatients >= 0 },
        ].map((k, i) => (
          <Col key={i} xl={2} md={4} sm={6}>
            <Card className="stat-card border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center gap-3 py-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: `${k.color}20`, flexShrink: 0 }}>
                  <span style={{ color: k.color, fontSize: '1.3rem' }}>{k.icon}</span>
                </div>
                <div>
                  <div className="fw-bold fs-4 lh-1 mb-1">{k.value.toLocaleString('fr-FR')}</div>
                  <div className="text-muted small">{k.label}</div>
                  <div className={`trend-badge ${k.up ? 'trend-up' : 'trend-down'} mt-1`}>
                    {k.up ? <FaArrowUp style={{ fontSize: '9px' }} /> : <FaArrowDown style={{ fontSize: '9px' }} />}
                    {k.trend}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── KPI CA ── */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
            <Card.Body className="d-flex align-items-center gap-4 py-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, background: '#19875420', flexShrink: 0 }}>
                <FaFileInvoice style={{ color: '#198754', fontSize: '1.6rem' }} />
              </div>
              <div>
                <div className="text-muted small">Chiffre d'affaires période</div>
                <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#198754' }}>{formatMontant(data.kpis.caTotal)}</div>
                <div className="text-muted small">Facturations + Consultations payées</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold small"><i className="bi bi-check2-all me-1 text-success"></i>Taux de complétion dossiers</span>
                <Badge bg={data.kpis.tauxCompletion >= 80 ? 'success' : data.kpis.tauxCompletion >= 50 ? 'warning' : 'danger'}>{data.kpis.tauxCompletion}%</Badge>
              </div>
              <ProgressBar now={data.kpis.tauxCompletion} variant={data.kpis.tauxCompletion >= 80 ? 'success' : data.kpis.tauxCompletion >= 50 ? 'warning' : 'danger'} style={{ height: 10, borderRadius: 8 }} />
              <Row className="mt-2 text-center">
                <Col><small className="text-muted">Reçus : <strong className="text-success">{data.kpis.patientsRecus}</strong></small></Col>
                <Col><small className="text-muted">En attente : <strong className="text-warning">{data.kpis.patientsEnAttente}</strong></small></Col>
                <Col><small className="text-muted">Total : <strong>{data.kpis.consultationsJour}</strong></small></Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Activité hebdomadaire */}
      <Row className="g-4 mb-4">
        <Col xl={8} lg={12}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0">
              <h5 className="mb-0"><FaChartLine className="me-2" />Activité hebdomadaire</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.activiteHebdomadaire} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="consultations" name="Consultations" fill="#0d6efd" radius={[4,4,0,0]} />
                  <Bar dataKey="rendezVous" name="Rendez-vous" fill="#0dcaf0" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4} lg={6}>
          <FamilleActeCard repartitionActes={data.repartitionActes} chartColors={CHART_COLORS} onPrintDetail={() => setShowRepartitionModal(true)} />
        </Col>
        <Col xl={4} lg={12}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0">
              <h5 className="mb-0">
                <FaChartBar className="me-2" />
                Performance métier
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Indicateur</th>
                    <th>Total</th>
                    <th>Taux</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.performanceParService.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.service}</strong></td>
                      <td>{item.total}</td>
                      <td>
                        <ProgressBar now={item.taux} label={`${item.taux}%`} variant={item.taux >= 85 ? "success" : item.taux >= 70 ? "info" : "warning"} />
                      </td>
                      <td>
                        <Badge bg={item.statut === "Excellent" ? "success" : item.statut === "Correct" ? "info" : "warning"}>{item.statut}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4} lg={6}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0">
              <h5 className="mb-0">
                <FaHospital className="me-2" />
                Alertes métier
              </h5>
            </Card.Header>
            <Card.Body>
              {data.alertesMetier.map((alerte, index) => (
                <Alert key={index} variant={alerte.niveau} className="py-2 mb-2 d-flex justify-content-between align-items-center">
                  <span>{alerte.libelle}</span>
                  <strong>{alerte.valeur}</strong>
                </Alert>
              ))}
              <Alert variant="light" className="border mb-0">
                Examens demandés : <strong>{data.kpis.examensDemandes}</strong>
                <span className="ms-2 trend-badge trend-down">
                  <FaArrowDown style={{ fontSize: "10px" }} />
                  {data.tendances.examens}%
                </span>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ══ Évolution CA + Top médecins CA ══ */}
      <Row className="g-4 mt-1 mb-1">
        <Col xl={7} lg={12}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0 variant-green-soft">
              <h5 className="mb-0"><FaChartLine className="me-2" />Évolution du chiffre d'affaires</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.evolutionCA} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatMontant(v)} labelStyle={{ fontWeight: 'bold' }} />
                  <Legend />
                  <Line type="monotone" dataKey="ca" name="CA (FCFA)" stroke="#198754" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={5} lg={12}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0 variant-blue-soft">
              <h5 className="mb-0"><FaChartBar className="me-2" />Top médecins — CA généré</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topMedecinsCA} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="medecin" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(v: any) => formatMontant(v)} />
                  <Bar dataKey="ca" name="CA (FCFA)" fill="#2563eb" radius={[0, 4, 4, 0]}>
                    {data.topMedecinsCA.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col md={12}>
          <Card className="professional-stat-card border-0 shadow-sm">
            <Card.Header className="professional-stat-header border-0 variant-blue-soft">
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Marge de progression par médecin
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Médecin</th>
                    <th>Spécialité</th>
                    <th>Actuel</th>
                    <th>Précédent</th>
                    <th>Progression</th>
                    <th>Objectif</th>
                    <th>Marge restante</th>
                    <th>Atteinte objectif</th>
                  </tr>
                </thead>
                <tbody>
                  {data.progressionParMedecin.map((item, index) => {
                    const progression = calculerProgression(item.actuel, item.precedent);
                    const marge = calculerMargeObjectif(item.actuel, item.objectif);
                    const tauxAtteinte = item.objectif === 0 ? 0 : (item.actuel / item.objectif) * 100;
                    return (
                      <tr key={index}>
                        <td><strong>{item.medecin}</strong></td>
                        <td>{item.specialite}</td>
                        <td>{item.actuel}</td>
                        <td>{item.precedent}</td>
                        <td>
                          <Badge bg={getProgressionVariant(progression)}>
                            {progression >= 0 ? "+" : ""}{progression.toFixed(1)}%
                          </Badge>
                        </td>
                        <td>{item.objectif}</td>
                        <td>
                          <Badge bg={marge <= 10 ? "success" : marge <= 30 ? "warning" : "danger"}>
                            {Math.max(marge, 0).toFixed(1)}%
                          </Badge>
                        </td>
                        <td style={{ minWidth: "160px" }}>
                          <ProgressBar now={Math.min(tauxAtteinte, 100)} label={`${tauxAtteinte.toFixed(0)}%`} variant={getObjectifVariant(item.actuel, item.objectif)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col xl={6} lg={6}>
          <Card className="advanced-stat-card border-0 shadow-sm h-100">
            <Card.Header className="advanced-stat-header border-0 variant-orange">
              <div>
                <h5 className="mb-1">
                  <FaChartPie className="me-2" />
                  Montants examens et consultations par assurance
                </h5>
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" variant="light" className="details-pill" onClick={() => afficherDetails("Montants par assurance", data.recapMontantParAssurance.flatMap(item => item.details))}>
                  Détails
                </Button>
                <Button size="sm" variant="outline-primary" className="details-pill" onClick={() => setShowAssuranceModal(true)}>
                  <FaDownload className="me-1" />État
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="metric-summary mb-3">
                <span>Total assurances</span>
                <strong>{formatMontant(totalAssurances)}</strong>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.recapMontantParAssurance}
                    dataKey="montantTotal"
                    nameKey="assurance"
                    cx="50%" cy="50%"
                    outerRadius={80}
                    onClick={(entry: any) => afficherDetails(entry.assurance, entry.details)}
                    style={{ cursor: 'pointer' }}
                  >
                    {data.recapMontantParAssurance.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatMontant(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <Table responsive size="sm" className="mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Assurance</th>
                    <th>Consultations</th>
                    <th>Examens</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recapMontantParAssurance.map((item, index) => (
                    <tr key={index} onClick={() => afficherDetails(item.assurance, item.details)} className="detail-row">
                      <td>{item.assurance}</td>
                      <td>{formatMontant(item.montantConsultations)}</td>
                      <td>{formatMontant(item.montantExamens)}</td>
                      <td><strong>{formatMontant(item.montantTotal)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6} lg={6}>
          <Card className="advanced-stat-card border-0 shadow-sm h-100">
            <Card.Header className="advanced-stat-header border-0 variant-purple">
              <div>
                <h5 className="mb-1">
                  <FaChartPie className="me-2" />
                  Consultations par sexe
                </h5>
               
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" variant="light" className="details-pill" onClick={() => afficherDetails("Consultations par sexe", data.examensConsultationsParSexe.flatMap(item => item.details))}>
                  Détails
                </Button>
                <Button size="sm" variant="outline-primary" className="details-pill" onClick={() => setShowSexeModal(true)}>
                  <FaDownload className="me-1" />État
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="metric-summary mb-3">
                <span>Total actes suivis</span>
                <strong>{data.examensConsultationsParSexe.reduce((sum, item) => sum + item.total, 0)}</strong>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.examensConsultationsParSexe}
                    dataKey="total"
                    nameKey="sexe"
                    cx="50%" cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name === 'M' ? 'Hommes' : name === 'F' ? 'Femmes' : name||'?'} ${((percent||0)*100).toFixed(0)}%`}
                    onClick={(entry: any) => afficherDetails(entry.sexe, entry.details)}
                    style={{ cursor: 'pointer' }}
                  >
                    {data.examensConsultationsParSexe.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#0d6efd' : '#dc3545'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => Number(v).toLocaleString('fr-FR')} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <Table responsive size="sm" className="mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Sexe</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.examensConsultationsParSexe.map((item, index) => (
                    <tr key={index} onClick={() => afficherDetails(item.sexe, item.details)} className="detail-row">
                      <td>{item.sexe}</td>
                      <td><strong>{item.total}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>          

      {/* ── Examens biologiques par sexe ── */}
      <Row className="g-4 mt-1">
        <Col xl={12} lg={12}>
          <Card className="advanced-stat-card border-0 shadow-sm h-100">
            <Card.Header className="advanced-stat-header border-0 variant-teal">
              <div>
                <h5 className="mb-1">
                  <FaChartBar className="me-2" />
                  Examens biologiques par sexe
                </h5>
              </div>
              <Button size="sm" variant="outline-primary" className="details-pill" onClick={() => setShowBioSexeModal(true)}>
                <FaDownload className="me-1" />État
              </Button>
            </Card.Header>
            <Card.Body>
              {(data.examensBioParSexe || []).length === 0 ? (
                <Alert variant="info" className="mb-0">Aucun examen biologique sur la période.</Alert>
              ) : (
                <>
                  <div className="metric-summary mb-3">
                    <span>Total examens</span>
                    <strong>{(data.examensBioParSexe || []).reduce((s, r) => s + r.total, 0).toLocaleString('fr-FR')}</strong>
                  </div>
                  <Table responsive hover size="sm" className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Prestation</th>
                        <th className="text-center" style={{ color: '#dc3545' }}>Féminin (F)</th>
                        <th className="text-center" style={{ color: '#0d6efd' }}>Masculin (M)</th>
                        <th className="text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.examensBioParSexe || []).map((item, i) => (
                        <tr key={i}>
                          <td className="fw-semibold small">{item.prestation}</td>
                          <td className="text-center">{item.F > 0 ? item.F : <span className="text-muted">—</span>}</td>
                          <td className="text-center">{item.M > 0 ? item.M : <span className="text-muted">—</span>}</td>
                          <td className="text-center fw-bold">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-secondary fw-bold">
                      <tr>
                        <td>TOTAL</td>
                        <td className="text-center">{(data.examensBioParSexe || []).reduce((s, r) => s + r.F, 0)}</td>
                        <td className="text-center">{(data.examensBioParSexe || []).reduce((s, r) => s + r.M, 0)}</td>
                        <td className="text-center">{(data.examensBioParSexe || []).reduce((s, r) => s + r.total, 0)}</td>
                      </tr>
                    </tfoot>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col xl={6} lg={6}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0 variant-green-soft">
              <h5 className="mb-0">
                <FaStethoscope className="me-2" />
                Marge par acte médical
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Acte</th>
                    <th>Actuel</th>
                    <th>Progression</th>
                    <th>Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {data.progressionParActe.map((item, index) => {
                    const progression = calculerProgression(item.actuel, item.precedent);
                    const marge = calculerMargeObjectif(item.actuel, item.objectif);
                    return (
                      <tr key={index}>
                        <td><strong>{item.acte}</strong></td>
                        <td>{item.actuel}/{item.objectif}</td>
                        <td>
                          <Badge bg={getProgressionVariant(progression)}>
                            {progression >= 0 ? "+" : ""}{progression.toFixed(1)}%
                          </Badge>
                        </td>
                        <td>
                          <ProgressBar now={Math.min((item.actuel / item.objectif) * 100, 100)} label={`${Math.max(marge, 0).toFixed(0)}% restant`} variant={getObjectifVariant(item.actuel, item.objectif)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6} lg={6}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0 variant-purple-soft">
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Progression des indicateurs clés
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Indicateur</th>
                    <th>Actuel</th>
                    <th>Évolution</th>
                    <th>Objectif</th>
                  </tr>
                </thead>
                <tbody>
                  {data.progressionIndicateurs.map((item, index) => {
                    const progression = calculerProgression(item.actuel, item.precedent);
                    const tauxAtteinte = item.objectif === 0 ? 0 : (item.actuel / item.objectif) * 100;
                    return (
                      <tr key={index}>
                        <td><strong>{item.indicateur}</strong></td>
                        <td>{item.actuel}{item.unite}</td>
                        <td>
                          <Badge bg={getProgressionVariant(progression)}>
                            {progression >= 0 ? "+" : ""}{progression.toFixed(1)}%
                          </Badge>
                        </td>
                        <td style={{ minWidth: "150px" }}>
                          <ProgressBar now={Math.min(tauxAtteinte, 100)} label={`${item.objectif}${item.unite}`} variant={getObjectifVariant(item.actuel, item.objectif)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-1">
        <Col xl={6} lg={6}>
          <Card className="advanced-stat-card border-0 shadow-sm h-100">
            <Card.Header className="advanced-stat-header border-0">
              <div>
                <h5 className="mb-1">
                  <FaChartBar className="me-2" />
                  Actes et examens par montant payé
                </h5>
              </div>
              <Button size="sm" variant="light" className="details-pill" onClick={() => afficherDetails("Actes et examens par montant payé", data.actesExamensParMontant.flatMap(item => item.details))}>
                Détails
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="metric-summary mb-3">
                <span>Total payé</span>
                <strong>{formatMontant(totalMontantsActes)}</strong>
              </div>
              <Table responsive hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>Montant</th>
                    <th>% du total</th>
                    <th>Répartition</th>
                  </tr>
                </thead>
                <tbody>
                  {data.actesExamensParMontant.map((item, index) => {
                    const pourcentage = totalMontantsActes === 0 ? 0 : (item.montant / totalMontantsActes) * 100;
                    return (
                      <tr key={index} onClick={() => afficherDetails(item.designation, item.details)} className="detail-row">
                        <td><strong>{item.designation}</strong></td>
                        <td>{formatMontant(item.montant)}</td>
                        <td>
                          <Badge bg={pourcentage >= 40 ? "success" : pourcentage >= 20 ? "info" : "secondary"}>
                            {pourcentage.toFixed(1)}%
                          </Badge>
                        </td>
                        <td style={{ minWidth: "170px" }}>
                          <ProgressBar now={Math.min(pourcentage, 100)} label={`${pourcentage.toFixed(0)}%`} variant={pourcentage >= 40 ? "success" : pourcentage >= 20 ? "info" : "warning"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6} lg={6}>
          <Card className="advanced-stat-card border-0 shadow-sm h-100">
            <Card.Header className="advanced-stat-header border-0 variant-green">
              <div>
                <h5 className="mb-1">
                  <FaUsers className="me-2" />
                  Patients consultés par médecin
                </h5>
              </div>
              <Button size="sm" variant="light" className="details-pill" onClick={() => afficherDetails("Patients consultés par médecin", data.patientsConsultesParMedecin.flatMap(item => item.details))}>
                Détails
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="metric-summary mb-3">
                <span>Patients distincts</span>
                <strong>{totalPatientsConsultes}</strong>
              </div>
              <Table responsive hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Médecin</th>
                    <th>Patients distincts</th>
                    <th>% du total</th>
                    <th>Répartition</th>
                  </tr>
                </thead>
                <tbody>
                  {data.patientsConsultesParMedecin.map((item, index) => {
                    const pourcentage = totalPatientsConsultes === 0 ? 0 : (item.nombre / totalPatientsConsultes) * 100;
                    return (
                      <tr key={index} onClick={() => afficherDetails(item.medecin, item.details)} className="detail-row">
                        <td><strong>{item.medecin}</strong></td>
                        <td>{item.nombre}</td>
                        <td>
                          <Badge bg={pourcentage >= 40 ? "success" : pourcentage >= 20 ? "info" : "secondary"}>
                            {pourcentage.toFixed(1)}%
                          </Badge>
                        </td>
                        <td style={{ minWidth: "170px" }}>
                          <ProgressBar now={Math.min(pourcentage, 100)} label={`${pourcentage.toFixed(0)}%`} variant={pourcentage >= 40 ? "success" : pourcentage >= 20 ? "info" : "warning"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      

      {/* Modal état imprimable répartition par médecin */}
      <Modal show={showRepartitionModal} onHide={() => setShowRepartitionModal(false)} size="xl" centered scrollable>
        <Modal.Header closeButton className="d-print-none">
          <Modal.Title><FaChartPie className="me-2" />Répartition des actes par médecin</Modal.Title>
        </Modal.Header>
        <Modal.Body id="print-repartition">
          {data && (() => {
            const rows = data.repartitionActesDetail || [];
            const familles = [...new Set(rows.map(r => r.famille))].sort();
            const medecins = [...new Set(rows.map(r => r.medecin))].sort();
            // Pivot : medecin → famille → count
            const pivot = new Map<string, Map<string, number>>();
            for (const r of rows) {
              if (!pivot.has(r.medecin)) pivot.set(r.medecin, new Map());
              pivot.get(r.medecin)!.set(r.famille, r.count);
            }
            const totalParFamille = new Map<string, number>();
            for (const f of familles) totalParFamille.set(f, rows.filter(r => r.famille === f).reduce((s, r) => s + r.count, 0));
            const totalGeneral = rows.reduce((s, r) => s + r.count, 0);
            return (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 d-print-block">
                  <div>
                    <div className="fw-bold fs-6">RÉPARTITION DES ACTES PAR MÉDECIN</div>
                    <div className="text-muted small">Période : {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="text-muted small">Total général : <strong>{totalGeneral.toLocaleString('fr-FR')}</strong></div>
                </div>
                <Table bordered size="sm" className="mb-0 align-middle" style={{ fontSize: 12 }}>
                  <thead className="table-dark">
                    <tr>
                      <th style={{ minWidth: 160 }}>Médecin</th>
                      {familles.map(f => <th key={f} className="text-center" style={{ minWidth: 90 }}>{f}</th>)}
                      <th className="text-center bg-secondary text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medecins.map(med => {
                      const row = pivot.get(med)!;
                      const total = familles.reduce((s, f) => s + (row.get(f) || 0), 0);
                      if (total === 0) return null;
                      return (
                        <tr key={med}>
                          <td className="fw-semibold">{med}</td>
                          {familles.map(f => (
                            <td key={f} className="text-center">{row.get(f) ? row.get(f)!.toLocaleString('fr-FR') : <span className="text-muted">—</span>}</td>
                          ))}
                          <td className="text-center fw-bold table-secondary">{total.toLocaleString('fr-FR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-dark fw-bold">
                    <tr>
                      <td>TOTAL</td>
                      {familles.map(f => <td key={f} className="text-center">{(totalParFamille.get(f) || 0).toLocaleString('fr-FR')}</td>)}
                      <td className="text-center">{totalGeneral.toLocaleString('fr-FR')}</td>
                    </tr>
                  </tfoot>
                </Table>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer className="d-print-none">
          <Button variant="secondary" onClick={() => setShowRepartitionModal(false)}>Fermer</Button>
          <Button variant="outline-primary" onClick={() => {
            const el = document.getElementById('print-repartition');
            if (!el) return;
            const headerHTML = generatePrintHeader(entreprise);
            const footerHTML = generatePrintFooter(entreprise);
            createPrintWindow('Répartition des actes par médecin', headerHTML, el.innerHTML, footerHTML);
          }}>
            🖨️ Avec entête
          </Button>
          <Button variant="primary" onClick={() => {
            const el = document.getElementById('print-repartition');
            if (!el) return;
            createPrintWindowWithoutHeader('Répartition des actes par médecin', el.innerHTML);
          }}>
            📄 Sans entête
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal état imprimable : Montants par assurance ── */}
      <Modal show={showAssuranceModal} onHide={() => setShowAssuranceModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title><FaFileInvoice className="me-2" />Montants par assurance</Modal.Title>
        </Modal.Header>
        <Modal.Body id="print-assurance">
          {data && (() => {
            const rows = data.recapMontantParAssurance;
            const totalConsult = rows.reduce((s, r) => s + r.montantConsultations, 0);
            const totalExam   = rows.reduce((s, r) => s + r.montantExamens, 0);
            const totalGen    = rows.reduce((s, r) => s + r.montantTotal, 0);
            return (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="fw-bold fs-6">MONTANTS PAR ASSURANCE</div>
                    <div className="text-muted small">Période : {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="text-muted small">Total : <strong>{formatMontant(totalGen)}</strong></div>
                </div>
                <Table bordered size="sm" className="mb-0 align-middle" style={{ fontSize: 12 }}>
                  <thead className="table-dark">
                    <tr>
                      <th className="text-center" style={{ width: 40 }}>N°</th>
                      <th>Assurance</th>
                      <th className="text-end">Consultations</th>
                      <th className="text-end">Examens</th>
                      <th className="text-end">Montant Total</th>
                      <th className="text-center">Taux (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, i) => (
                      <tr key={i}>
                        <td className="text-center text-muted">{i + 1}</td>
                        <td className="fw-semibold">{item.assurance}</td>
                        <td className="text-end">{formatMontant(item.montantConsultations)}</td>
                        <td className="text-end">{formatMontant(item.montantExamens)}</td>
                        <td className="text-end fw-bold">{formatMontant(item.montantTotal)}</td>
                        <td className="text-center">{item.taux > 0 ? `${item.taux}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-dark fw-bold">
                    <tr>
                      <td colSpan={2}>TOTAL</td>
                      <td className="text-end">{formatMontant(totalConsult)}</td>
                      <td className="text-end">{formatMontant(totalExam)}</td>
                      <td className="text-end">{formatMontant(totalGen)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </Table>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssuranceModal(false)}>Fermer</Button>
          <Button variant="outline-primary" onClick={() => {
            const el = document.getElementById('print-assurance');
            if (!el) return;
            createPrintWindow('Montants par assurance', generatePrintHeader(entreprise), el.innerHTML, generatePrintFooter(entreprise));
          }}>🖨️ Avec entête</Button>
          <Button variant="primary" onClick={() => {
            const el = document.getElementById('print-assurance');
            if (!el) return;
            createPrintWindowWithoutHeader('Montants par assurance', el.innerHTML);
          }}>📄 Sans entête</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal état imprimable : Consultations par sexe ── */}
      <Modal show={showSexeModal} onHide={() => setShowSexeModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title><FaUsers className="me-2" />Consultations par sexe</Modal.Title>
        </Modal.Header>
        <Modal.Body id="print-sexe">
          {data && (() => {
            const rows = data.examensConsultationsParSexe;

            // Comptage par acte et sexe depuis les détails
            const acteMap = new Map<string, { F: number; M: number }>();
            rows.forEach(r => {
              const sexeKey = (r.sexe === 'F' || r.sexe?.toLowerCase().startsWith('f')) ? 'F' : 'M';
              r.details.forEach((d: any) => {
                const acte = d.designation || 'Consultation';
                const cur = acteMap.get(acte) || { F: 0, M: 0 };
                cur[sexeKey]++;
                acteMap.set(acte, cur);
              });
            });

            const actes = [...acteMap.keys()].sort();

            // Totaux calculés depuis acteMap pour cohérence avec les lignes
            let totalF = 0, totalH = 0;
            acteMap.forEach(c => { totalF += c.F; totalH += c.M; });

            // Fallback sur r.total si pas de détails
            if (totalF === 0 && totalH === 0) {
              rows.forEach(r => {
                const isF = r.sexe === 'F' || r.sexe?.toLowerCase().startsWith('f');
                if (isF) totalF += r.total; else totalH += r.total;
              });
            }
            const totalGen = totalF + totalH;

            return (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="fw-bold fs-6">CONSULTATIONS PAR SEXE</div>
                    <div className="text-muted small">Période : {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="text-muted small">Total : <strong>{totalGen}</strong></div>
                </div>
                <Table bordered size="sm" className="mb-0 align-middle" style={{ fontSize: 12 }}>
                  <thead className="table-dark">
                    <tr>
                      <th>Acte de consultation</th>
                      <th className="text-center">Féminin (F)</th>
                      <th className="text-center">Masculin (M)</th>
                      <th className="text-center fw-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actes.length > 0 ? actes.map((acte, i) => {
                      const c = acteMap.get(acte)!;
                      return (
                        <tr key={i}>
                          <td className="fw-semibold">{acte}</td>
                          <td className="text-center">{c.F > 0 ? c.F : '—'}</td>
                          <td className="text-center">{c.M > 0 ? c.M : '—'}</td>
                          <td className="text-center fw-bold">{c.F + c.M}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td>Toutes consultations</td>
                        <td className="text-center">{totalF}</td>
                        <td className="text-center">{totalH}</td>
                        <td className="text-center fw-bold">{totalGen}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="table-dark fw-bold">
                    <tr>
                      <td>TOTAL</td>
                      <td className="text-center">{totalF}</td>
                      <td className="text-center">{totalH}</td>
                      <td className="text-center">{totalGen}</td>
                    </tr>
                  </tfoot>
                </Table>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSexeModal(false)}>Fermer</Button>
          <Button variant="outline-primary" onClick={() => {
            const el = document.getElementById('print-sexe');
            if (!el) return;
            createPrintWindow('Consultations par sexe', generatePrintHeader(entreprise), el.innerHTML, generatePrintFooter(entreprise));
          }}>🖨️ Avec entête</Button>
          <Button variant="primary" onClick={() => {
            const el = document.getElementById('print-sexe');
            if (!el) return;
            createPrintWindowWithoutHeader('Consultations par sexe', el.innerHTML);
          }}>📄 Sans entête</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal état imprimable : Examens biologiques par sexe ── */}
      <Modal show={showBioSexeModal} onHide={() => setShowBioSexeModal(false)} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title><FaChartBar className="me-2" />Examens biologiques par sexe</Modal.Title>
        </Modal.Header>
        <Modal.Body id="print-bio-sexe">
          {data && (() => {
            const rows = data.examensBioParSexe || [];
            const totalF   = rows.reduce((s, r) => s + r.F, 0);
            const totalH   = rows.reduce((s, r) => s + r.M, 0);
            const totalGen = rows.reduce((s, r) => s + r.total, 0);
            return (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="fw-bold fs-6">EXAMENS BIOLOGIQUES PAR SEXE</div>
                    <div className="text-muted small">Période : {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="text-muted small">Total : <strong>{totalGen.toLocaleString('fr-FR')}</strong></div>
                </div>
                <Table bordered size="sm" className="mb-0 align-middle" style={{ fontSize: 12 }}>
                  <thead className="table-dark">
                    <tr>
                      <th>Prestation</th>
                      <th className="text-center">Féminin (F)</th>
                      <th className="text-center">Masculin (M)</th>
                      <th className="text-center fw-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? rows.map((item, i) => (
                      <tr key={i}>
                        <td className="fw-semibold">{item.prestation}</td>
                        <td className="text-center">{item.F > 0 ? item.F : '—'}</td>
                        <td className="text-center">{item.M > 0 ? item.M : '—'}</td>
                        <td className="text-center fw-bold">{item.total}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="text-center text-muted">Aucune donnée</td></tr>
                    )}
                  </tbody>
                  <tfoot className="table-dark fw-bold">
                    <tr>
                      <td>TOTAL</td>
                      <td className="text-center">{totalF}</td>
                      <td className="text-center">{totalH}</td>
                      <td className="text-center">{totalGen}</td>
                    </tr>
                  </tfoot>
                </Table>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBioSexeModal(false)}>Fermer</Button>
          <Button variant="outline-primary" onClick={() => {
            const el = document.getElementById('print-bio-sexe');
            if (!el) return;
            createPrintWindow('Examens biologiques par sexe', generatePrintHeader(entreprise), el.innerHTML, generatePrintFooter(entreprise));
          }}>🖨️ Avec entête</Button>
          <Button variant="primary" onClick={() => {
            const el = document.getElementById('print-bio-sexe');
            if (!el) return;
            createPrintWindowWithoutHeader('Examens biologiques par sexe', el.innerHTML);
          }}>📄 Sans entête</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDetailModal} onHide={fermerDetails} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Détails : {detailTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailRows.length === 0 ? (
            <Alert variant="info" className="mb-0">Aucun détail disponible.</Alert>
          ) : (
            <Table responsive hover size="sm" className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Désignation</th>
                  <th>Montant</th>
                  <th>Sexe</th>
                  <th>Code dossier</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.date ? new Date(row.date).toLocaleDateString("fr-FR") : "-"}</td>
                    <td>{row.patient || "-"}</td>
                    <td>{row.designation || row.prestation || "-"}</td>
                    <td>{row.montant ? formatMontant(row.montant) : "-"}</td>
                    <td>{row.sexe || "-"}</td>
                    <td>{row.codeDossier || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Badge bg="light" text="dark">{detailRows.length} ligne(s)</Badge>
          <Button variant="secondary" onClick={fermerDetails}>Fermer</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .statistique-container {
          padding: 22px;
          border-radius: 28px;
          background: linear-gradient(135deg, #f8fafc 0%, #eef7ff 48%, #f0fdfa 100%);
        }

        .stats-hero {
          gap: 24px;
          padding: 26px;
          border-radius: 26px;
          color: #ffffff;
          background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.22), transparent 30%), linear-gradient(135deg, #075985 0%, #0f766e 100%);
          box-shadow: 0 24px 55px rgba(15, 118, 110, 0.22);
        }

        .stats-hero h2 {
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .stats-hero p {
          color: rgba(255, 255, 255, 0.78);
        }

        .stats-eyebrow {
          display: inline-flex;
          align-items: center;
          margin-bottom: 8px;
          padding: 5px 12px;
          border-radius: 999px;
          color: #075985;
          background: rgba(255, 255, 255, 0.92);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stats-filter-panel {
          align-items: end;
          padding: 14px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(14px);
        }

        .stats-filter-panel :global(label) {
          color: rgba(255, 255, 255, 0.86);
          font-size: 12px;
          font-weight: 700;
        }

        .stats-filter-panel :global(.form-control) {
          min-width: 135px;
          border: 0;
          border-radius: 999px;
          box-shadow: none;
        }

        .stats-filter-panel :global(.btn) {
          border-radius: 999px;
          font-weight: 700;
        }

        .stat-card {
          position: relative;
          overflow: hidden;
          min-height: 188px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.96);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 5px;
          background: linear-gradient(90deg, #2563eb, #06b6d4);
        }

        .stat-card-warning::before {
          background: linear-gradient(90deg, #f59e0b, #f97316);
        }

        .stat-card-success::before {
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .stat-card-info::before {
          background: linear-gradient(90deg, #06b6d4, #0284c7);
        }

        .stat-card h3 {
          color: #0f172a;
          font-size: 2rem;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .stat-card p {
          font-weight: 700;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 22px 48px rgba(15, 23, 42, 0.14) !important;
        }

        .professional-stat-card {
          overflow: hidden;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.97);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .professional-stat-card:hover,
        .advanced-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 48px rgba(15, 23, 42, 0.12) !important;
        }

        .professional-stat-header {
          padding: 17px 20px;
          color: #ffffff;
          background: linear-gradient(135deg, #0f766e 0%, #0369a1 100%);
        }

        .professional-stat-header h5 {
          font-weight: 800;
        }

        .professional-stat-header.variant-blue-soft {
          background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%);
        }

        .professional-stat-header.variant-green-soft {
          background: linear-gradient(135deg, #059669 0%, #0f766e 100%);
        }

        .professional-stat-header.variant-purple-soft {
          background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
        }

        .advanced-stat-card {
          overflow: hidden;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.97);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .advanced-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .advanced-stat-header small {
          color: rgba(255, 255, 255, 0.82);
        }

        .advanced-stat-header.variant-green {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .advanced-stat-header.variant-orange {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        }

        .advanced-stat-header.variant-purple {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .advanced-stat-header.variant-blue {
          background: linear-gradient(135deg, #0891b2 0%, #0369a1 100%);
        }

        .details-pill {
          border-radius: 999px;
          color: #1f2937;
          font-weight: 700;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
          white-space: nowrap;
        }

        .metric-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
        }

        .metric-summary span {
          color: #64748b;
          font-weight: 600;
        }

        .metric-summary strong {
          color: #0f172a;
          font-size: 1rem;
        }

        .summary-badge {
          border-radius: 999px;
          padding: 8px 12px;
        }
        
        .detail-row {
          cursor: pointer;
        }

        .detail-row:hover {
          background: #f0f9ff;
        }
        
        .trend-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .trend-up {
          background: #d4edda;
          color: #155724;
        }
        
        .trend-down {
          background: #f8d7da;
          color: #721c24;
        }

        @media (max-width: 992px) {
          .stats-hero {
            flex-direction: column;
            align-items: flex-start !important;
          }

          .stats-filter-panel {
            width: 100%;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 576px) {
          .statistique-container {
            padding: 14px;
          }

          .stats-hero {
            padding: 20px;
          }

          .stats-filter-panel {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-filter-panel :global(.form-control),
          .stats-filter-panel :global(.btn) {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
