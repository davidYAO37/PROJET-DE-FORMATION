"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Container, Form, Row, Spinner, Button, Modal, Table, Badge } from 'react-bootstrap';
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
  LineChart,
  Line
} from 'recharts';

interface Totals {
  total: number;
  pris: number;
  disponibles: number;
  presents: number;
  enCours: number;
  annules: number;
  reportes: number;
  rdvDuJour: number;
}

interface Taux {
  occupation: number;
  presence: number;
  annulation: number;
  report: number;
}

interface Capacite {
  totale: number;
  occupee: number;
  restante: number;
}

interface StatusItem {
  label: string;
  value: number;
  color: string;
}

interface MoisItem {
  mois: string;
  total: number;
  pris: number;
  presents: number;
  annules: number;
  reportes: number;
}

interface MedecinItem {
  medecinId: string;
  nom: string;
  total: number;
  pris: number;
  presents: number;
  annules: number;
  reportes: number;
}

interface JourItem {
  jour: string;
  total: number;
}

interface DetailItem {
  id: string;
  patient: string;
  patientContact: string;
  medecin: string;
  specialite: string;
  statut: string;
  statutPris: boolean;
  dateDisponibilite: string;
  datePlanning: string;
  description: string;
  nouvelleDate: string | null;
  motifReport: string | null;
  annulationType: string | null;
  serviceIndisponible: boolean;
  prisPar: string;
  saisiPar: string;
}

interface StatsData {
  totals: Totals;
  taux: Taux;
  capacite: Capacite;
  parStatus: StatusItem[];
  parMois: MoisItem[];
  parMedecin: MedecinItem[];
  parJour: JourItem[];
}

const initialStats: StatsData = {
  totals: { total: 0, pris: 0, disponibles: 0, presents: 0, enCours: 0, annules: 0, reportes: 0, rdvDuJour: 0 },
  taux: { occupation: 0, presence: 0, annulation: 0, report: 0 },
  capacite: { totale: 0, occupee: 0, restante: 0 },
  parStatus: [],
  parMois: [],
  parMedecin: [],
  parJour: []
};

const kpiCards = (totals: Totals, taux: Taux) => [
  { label: 'Rendez-vous total', value: totals.total, icon: 'bi-calendar-check', color: 'primary' },
  { label: 'Rendez-vous du jour', value: totals.rdvDuJour, icon: 'bi-calendar-day', color: 'info' },
  { label: 'Pris', value: totals.pris, icon: 'bi-check-circle', color: 'success' },
  { label: 'Présents', value: totals.presents, icon: 'bi-person-check', color: 'success' },
  { label: 'En cours', value: totals.enCours, icon: 'bi-hourglass-split', color: 'primary' },
  { label: 'Annulés', value: totals.annules, icon: 'bi-x-circle', color: 'danger' },
  { label: 'Reportés', value: totals.reportes, icon: 'bi-clock-history', color: 'warning' },
  { label: 'Disponibles', value: totals.disponibles, icon: 'bi-calendar', color: 'secondary' },
  { label: 'Taux présence', value: `${taux.presence}%`, icon: 'bi-graph-up-arrow', color: 'success' },
  { label: 'Taux occupation', value: `${taux.occupation}%`, icon: 'bi-pie-chart', color: 'info' }
];

export default function StatistiquesRendezvousPage() {
  const [data, setData] = useState<StatsData>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailItems, setDetailItems] = useState<DetailItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const { entreprise } = useEntreprise();

  const fetchDetails = async (title: string, params: URLSearchParams) => {
    try {
      setDetailLoading(true);
      setDetailTitle(title);
      setShowDetail(true);
      const res = await fetch(`/api/rendez-vous/liste?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur lors du chargement des détails');
      const json = await res.json();
      setDetailItems(json);
    } catch (err: any) {
      setDetailItems([]);
      alert(err.message || 'Erreur');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleKpiDetail = (label: string) => {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);

    switch (label) {
      case 'Rendez-vous total':
        fetchDetails('Tous les rendez-vous', params);
        break;
      case 'Rendez-vous du jour':
        fetchDetails('Rendez-vous du jour', params);
        break;
      case 'Pris':
        params.append('pris', 'true');
        fetchDetails('Rendez-vous pris', params);
        break;
      case 'Présents':
        params.append('statut', '2');
        fetchDetails('Rendez-vous présents', params);
        break;
      case 'En cours':
        params.append('statut', '1');
        fetchDetails('Rendez-vous en cours', params);
        break;
      case 'Annulés':
        params.append('statut', '3');
        fetchDetails('Rendez-vous annulés', params);
        break;
      case 'Reportés':
        params.append('statut', '4');
        fetchDetails('Rendez-vous reportés', params);
        break;
      case 'Disponibles':
        params.append('pris', 'false');
        fetchDetails('Rendez-vous disponibles', params);
        break;
      case 'Taux présence':
        params.append('statut', '2');
        fetchDetails('Rendez-vous présents (taux)', params);
        break;
      case 'Taux occupation':
        params.append('pris', 'true');
        fetchDetails('Rendez-vous occupés', params);
        break;
      default:
        fetchDetails(label, params);
    }
  };

  const getStatutLabel = (statut: string, serviceIndisponible: boolean) => {
    if (serviceIndisponible) return 'Service indisponible';
    switch (statut) {
      case '1': return 'En cours';
      case '2': return 'Présent';
      case '3': return 'Annulé';
      case '4': return 'Reporté';
      default: return 'Disponible';
    }
  };

  const handleStatutDetailClick = (label: string) => {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    switch (label) {
      case 'Présents': params.append('statut', '2'); break;
      case 'En cours': params.append('statut', '1'); break;
      case 'Annulés': params.append('statut', '3'); break;
      case 'Reportés': params.append('statut', '4'); break;
      case 'Disponibles': params.append('pris', 'false'); break;
      default: return;
    }
    fetchDetails(label, params);
  };

  const handleMoisDetailClick = (mois: string) => {
    const params = new URLSearchParams();
    params.append('mois', mois);
    fetchDetails(`Rendez-vous de ${mois}`, params);
  };

  const handleMedecinDetailClick = (medecin: MedecinItem) => {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    params.append('medecinId', medecin.medecinId);
    fetchDetails(`Rendez-vous - ${medecin.nom}`, params);
  };

  const handleJourDetailClick = (jour: string) => {
    const params = new URLSearchParams();
    params.append('jour', jour);
    fetchDetails(`Rendez-vous du ${jour}`, params);
  };

  const handlePrintDetails = () => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);

    const rows = detailItems.map(item => `
      <tr>
        <td>${item.patient}</td>
        <td>${item.patientContact}</td>
        <td>${item.medecin}</td>
        <td>${item.specialite}</td>
        <td>${item.dateDisponibilite}</td>
        <td>${item.datePlanning}</td>
        <td>${getStatutLabel(item.statut, item.serviceIndisponible)}</td>
        <td>${item.description}</td>
      </tr>
    `).join('');

    const contentHTML = `
      <div class="sub-header">${detailTitle.toUpperCase()}</div>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Contact</th>
            <th>Médecin</th>
            <th>Spécialité</th>
            <th>Date disponibilité</th>
            <th>Date planning</th>
            <th>Statut</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="text-center mt-4">
        <span class="fw-bold">Merci pour votre confiance</span><br/>
        <small>Imprimé le ${new Date().toLocaleString('fr-FR')}</small>
      </div>
    `;

    createPrintWindow(detailTitle, headerHTML, contentHTML, footerHTML);
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const res = await fetch(`/api/rendez-vous/statistiques-globales?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateDebut, dateFin]);

  const filteredMedecins = useMemo(() => {
    return [...data.parMedecin]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [data.parMedecin]);

  return (
    <Container fluid className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary m-0">
          <i className="bi bi-bar-chart-line me-2"></i>
          Statistiques des rendez-vous
        </h3>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label>Date début</Form.Label>
              <Form.Control
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Date fin</Form.Label>
              <Form.Control
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <button
                className="btn btn-primary w-100"
                onClick={fetchStats}
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <><i className="bi bi-arrow-clockwise me-2"></i>Actualiser</>
                )}
              </button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <Row className="g-3 mb-4">
        {kpiCards(data.totals, data.taux).map((kpi, idx) => (
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
                <button
                  className="btn btn-link btn-sm text-decoration-none p-0 ms-2 flex-shrink-0"
                  title="Voir les détails"
                  onClick={() => handleKpiDetail(kpi.label)}
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                </button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Répartition par statut</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={data.parStatus.filter(s => s.value > 0)}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                    onClick={(entry: any) => entry && handleStatutDetailClick(entry.name as string)}
                    style={{ cursor: 'pointer' }}
                  >
                    {data.parStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Évolution mensuelle</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.parMois} onClick={(e: any) => e && e.activeLabel && handleMoisDetailClick(e.activeLabel)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pris" name="Pris" stroke="#198754" strokeWidth={2} />
                  <Line type="monotone" dataKey="presents" name="Présents" stroke="#0d6efd" strokeWidth={2} />
                  <Line type="monotone" dataKey="annules" name="Annulés" stroke="#dc3545" strokeWidth={2} />
                  <Line type="monotone" dataKey="reportes" name="Reportés" stroke="#ffc107" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Top 10 médecins par rendez-vous</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={filteredMedecins} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="nom"
                    type="category"
                    width={130}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value: string) =>
                      value.length > 18 ? `${value.substring(0, 18)}...` : value
                    }
                  />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="pris" name="Pris" stackId="a" fill="#198754" onClick={(e: any) => e && e.medecinId && handleMedecinDetailClick(e as unknown as MedecinItem)} />
                  <Bar dataKey="annules" name="Annulés" stackId="a" fill="#dc3545" onClick={(e: any) => e && e.medecinId && handleMedecinDetailClick(e as unknown as MedecinItem)} />
                  <Bar dataKey="reportes" name="Reportés" stackId="a" fill="#ffc107" onClick={(e: any) => e && e.medecinId && handleMedecinDetailClick(e as unknown as MedecinItem)} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Capacité du planning</h6>
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center">
              <Row className="g-3 text-center">
                <Col xs={4}>
                  <h4 className="text-primary fw-bold">{data.capacite.totale}</h4>
                  <small className="text-muted">Places totales</small>
                </Col>
                <Col xs={4}>
                  <h4 className="text-success fw-bold">{data.capacite.occupee}</h4>
                  <small className="text-muted">Occupées</small>
                </Col>
                <Col xs={4}>
                  <h4 className="text-secondary fw-bold">{data.capacite.restante}</h4>
                  <small className="text-muted">Restantes</small>
                </Col>
              </Row>

              <div className="mt-4">
                <div className="d-flex justify-content-between mb-1">
                  <small>Taux d&apos;occupation</small>
                  <small className="fw-bold">{data.taux.occupation}%</small>
                </div>
                <div className="progress mb-3">
                  <div
                    className="progress-bar bg-info"
                    style={{ width: `${Math.min(data.taux.occupation, 100)}%` }}
                  ></div>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <small>Taux de présence</small>
                  <small className="fw-bold">{data.taux.presence}%</small>
                </div>
                <div className="progress mb-3">
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${Math.min(data.taux.presence, 100)}%` }}
                  ></div>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <small>Taux d&apos;annulation</small>
                  <small className="fw-bold">{data.taux.annulation}%</small>
                </div>
                <div className="progress mb-3">
                  <div
                    className="progress-bar bg-danger"
                    style={{ width: `${Math.min(data.taux.annulation, 100)}%` }}
                  ></div>
                </div>

                <div className="d-flex justify-content-between mb-1">
                  <small>Taux de report</small>
                  <small className="fw-bold">{data.taux.report}%</small>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${Math.min(data.taux.report, 100)}%` }}
                  ></div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Volume de rendez-vous par jour</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.parJour} onClick={(e: any) => e && e.activeLabel && handleJourDetailClick(e.activeLabel)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Bar dataKey="total" name="Total RDV" fill="#0d6efd" onClick={(e: any) => e && e.jour && handleJourDetailClick(e.jour as string)} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl" fullscreen="lg-down">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-list-check me-2"></i>
            {detailTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : detailItems.length === 0 ? (
            <div className="text-center text-muted py-5">Aucun rendez-vous trouvé.</div>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <Table striped bordered hover responsive size="sm">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Médecin</th>
                    <th>Date dispo.</th>
                    <th>Date planning</th>
                    <th>Statut</th>
                    <th>Description</th>
                    <th>Nouvelle date</th>
                    <th>Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.patient}</td>
                      <td>{item.patientContact}</td>
                      <td>{item.medecin}</td>
                      <td>{item.dateDisponibilite}</td>
                      <td>{item.datePlanning}</td>
                      <td>
                        {item.serviceIndisponible ? (
                          <Badge bg="dark">Service indisponible</Badge>
                        ) : (
                          <Badge bg={item.statut === '2' ? 'success' : item.statut === '3' ? 'danger' : item.statut === '4' ? 'warning' : item.statut === '1' ? 'primary' : 'secondary'} text={item.statut === '4' ? 'dark' : undefined}>
                            {getStatutLabel(item.statut, item.serviceIndisponible)}
                          </Badge>
                        )}
                      </td>
                      <td>{item.description}</td>
                      <td>{item.nouvelleDate || '-'}</td>
                      <td>{item.motifReport || item.annulationType || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handlePrintDetails} disabled={detailLoading || detailItems.length === 0}>
            <i className="bi bi-printer me-2"></i>
            Imprimer
          </Button>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
