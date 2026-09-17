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
  consultations: number;
  recus: number;
  salleAttente: number;
  enCours: number;
  transferts: number;
  constantes: number;
  rdvTotal: number;
  rdvDuJour: number;
  rdvConfirmes: number;
  rdvReportes: number;
  rdvAnnules: number;
  rdvEnCours: number;
}

interface StatusItem {
  label: string;
  value: number;
  color: string;
}

interface MoisItem {
  mois: string;
  recus: number;
  salleAttente: number;
  transferts: number;
  constantes: number;
  total: number;
}

interface MoisRdvItem {
  mois: string;
  total: number;
  confirmes: number;
  reportes: number;
  annules: number;
}

interface MedecinItem {
  medecinId: string;
  nom: string;
  total: number;
  recus: number;
  salleAttente: number;
  transferts: number;
  constantes: number;
}

interface JourItem {
  jour: string;
  total: number;
  recus: number;
  salleAttente: number;
}

interface StatsData {
  totals: Totals;
  parStatus: StatusItem[];
  parMois: MoisItem[];
  parMoisRdv: MoisRdvItem[];
  parMedecin: MedecinItem[];
  parJour: JourItem[];
}

interface DetailItem {
  id: string;
  patient: string;
  patientContact: string;
  codeDossier: string;
  medecin: string;
  specialite: string;
  date: string;
  heure: string;
  designation: string;
  statutC?: boolean;
  attenteAccueil?: number | boolean;
  datetransfert?: string | null;
  constantes?: boolean;
  temperature?: string;
  poids?: string;
  tension?: string;
  glycemie?: string;
  taille?: string;
  statut?: string;
  nouvelleDate?: string | null;
  motifReport?: string | null;
  annulationType?: string | null;
  description?: string;
}

const initialStats: StatsData = {
  totals: {
    consultations: 0,
    recus: 0,
    salleAttente: 0,
    enCours: 0,
    transferts: 0,
    constantes: 0,
    rdvTotal: 0,
    rdvDuJour: 0,
    rdvConfirmes: 0,
    rdvReportes: 0,
    rdvAnnules: 0,
    rdvEnCours: 0
  },
  parStatus: [],
  parMois: [],
  parMoisRdv: [],
  parMedecin: [],
  parJour: []
};

const kpiCards = (totals: Totals) => [
  { label: 'Consultations', value: totals.consultations, icon: 'bi-clipboard-plus', color: 'primary' },
  { label: 'Patients reçus', value: totals.recus, icon: 'bi-person-check', color: 'success' },
  { label: 'Salle d\'attente', value: totals.salleAttente, icon: 'bi-people', color: 'warning' },
  { label: 'En cours', value: totals.enCours, icon: 'bi-hourglass-split', color: 'info' },
  { label: 'Transferts', value: totals.transferts, icon: 'bi-arrow-left-right', color: 'secondary' },
  { label: 'Constantes', value: totals.constantes, icon: 'bi-clipboard2-pulse', color: 'danger' },
  { label: 'RDV total', value: totals.rdvTotal, icon: 'bi-calendar-check', color: 'primary' },
  { label: 'RDV du jour', value: totals.rdvDuJour, icon: 'bi-calendar-day', color: 'info' },
  { label: 'RDV confirmés', value: totals.rdvConfirmes, icon: 'bi-check-circle', color: 'success' },
  { label: 'RDV reportés', value: totals.rdvReportes, icon: 'bi-clock-history', color: 'warning' },
  { label: 'RDV annulés', value: totals.rdvAnnules, icon: 'bi-x-circle', color: 'danger' }
];

export default function StatistiquesAccueilPage() {
  const [data, setData] = useState<StatsData>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailItems, setDetailItems] = useState<DetailItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailApi, setDetailApi] = useState<'consultation' | 'rdv'>('consultation');

  const { entreprise } = useEntreprise();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const res = await fetch(`/api/accueil/statistiques?${params.toString()}`);
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

  const fetchDetails = async (title: string, api: 'consultation' | 'rdv', params: URLSearchParams) => {
    try {
      setDetailLoading(true);
      setDetailTitle(title);
      setDetailApi(api);
      setShowDetail(true);
      const endpoint = api === 'consultation' ? '/api/consultation/liste' : '/api/rendez-vous/liste';
      const res = await fetch(`${endpoint}?${params.toString()}`);
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
      case 'Consultations':
        fetchDetails('Toutes les consultations', 'consultation', params);
        break;
      case 'Patients reçus':
        params.append('type', 'recu');
        fetchDetails('Patients reçus', 'consultation', params);
        break;
      case 'Salle d\'attente':
        params.append('type', 'salleAttente');
        fetchDetails('Salle d\'attente', 'consultation', params);
        break;
      case 'En cours':
        params.append('type', 'enCours');
        fetchDetails('Consultations en cours', 'consultation', params);
        break;
      case 'Transferts':
        params.append('type', 'transfert');
        fetchDetails('Transferts', 'consultation', params);
        break;
      case 'Constantes':
        params.append('type', 'constantes');
        fetchDetails('Constantes saisies', 'consultation', params);
        break;
      case 'RDV total':
        fetchDetails('Tous les rendez-vous', 'rdv', params);
        break;
      case 'RDV du jour':
        fetchDetails('Rendez-vous du jour', 'rdv', params);
        break;
      case 'RDV confirmés':
        params.append('statut', '2');
        fetchDetails('Rendez-vous confirmés', 'rdv', params);
        break;
      case 'RDV reportés':
        params.append('statut', '4');
        fetchDetails('Rendez-vous reportés', 'rdv', params);
        break;
      case 'RDV annulés':
        params.append('statut', '3');
        fetchDetails('Rendez-vous annulés', 'rdv', params);
        break;
      default:
        fetchDetails(label, 'consultation', params);
    }
  };

  const handleMoisDetail = (mois: string, type: 'consultation') => {
    const params = new URLSearchParams();
    params.append('mois', mois);
    fetchDetails(`Consultations de ${mois}`, 'consultation', params);
  };

  const handleMoisRdvDetail = (mois: string) => {
    const params = new URLSearchParams();
    params.append('mois', mois);
    fetchDetails(`Rendez-vous de ${mois}`, 'rdv', params);
  };

  const handleMedecinDetail = (medecin: MedecinItem) => {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    params.append('medecinId', medecin.medecinId);
    fetchDetails(`Consultations - ${medecin.nom}`, 'consultation', params);
  };

  const handleJourDetail = (jour: string) => {
    const params = new URLSearchParams();
    params.append('jour', jour);
    fetchDetails(`Consultations du ${jour}`, 'consultation', params);
  };

  const getRdvStatutLabel = (statut?: string) => {
    switch (statut) {
      case '1': return 'En cours';
      case '2': return 'Confirmé';
      case '3': return 'Annulé';
      case '4': return 'Reporté';
      default: return '-';
    }
  };

  const handlePrintDetails = () => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);

    if (detailApi === 'consultation') {
      const rows = detailItems.map(item => `
        <tr>
          <td>${item.patient}</td>
          <td>${item.patientContact}</td>
          <td>${item.medecin}</td>
          <td>${item.specialite}</td>
          <td>${item.date}</td>
          <td>${item.heure}</td>
          <td>${item.datetransfert || '-'}</td>
          <td>${item.constantes ? 'Oui' : 'Non'}</td>
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
              <th>Date</th>
              <th>Heure</th>
              <th>Transfert</th>
              <th>Constantes</th>
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
    } else {
      const rows = detailItems.map(item => `
        <tr>
          <td>${item.patient}</td>
          <td>${item.patientContact}</td>
          <td>${item.medecin}</td>
          <td>${item.specialite}</td>
          <td>${item.date || '-'}</td>
          <td>${item.description || '-'}</td>
          <td>${getRdvStatutLabel(item.statut)}</td>
          <td>${item.nouvelleDate || '-'}</td>
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
              <th>Date</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Nouvelle date</th>
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
    }
  };

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
          Statistiques Accueil
        </h3>
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
        {kpiCards(data.totals).map((kpi, idx) => (
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
                <button className="btn btn-link btn-sm text-decoration-none p-0 ms-2 flex-shrink-0" title="Voir les détails" onClick={() => handleKpiDetail(kpi.label)}>
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
              <h6 className="fw-bold">Répartition RDV par statut</h6>
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
                    onClick={(entry: any) => entry && handleKpiDetail(entry.name as string)}
                  >
                    {data.parStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
              <h6 className="fw-bold">Évolution mensuelle des consultations</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.parMois} onClick={(e: any) => e && e.activeLabel && handleMoisDetail(e.activeLabel, 'consultation')} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="recus" name="Patients reçus" stroke="#198754" strokeWidth={2} />
                  <Line type="monotone" dataKey="salleAttente" name="Salle d'attente" stroke="#ffc107" strokeWidth={2} />
                  <Line type="monotone" dataKey="transferts" name="Transferts" stroke="#6c757d" strokeWidth={2} />
                  <Line type="monotone" dataKey="constantes" name="Constantes" stroke="#dc3545" strokeWidth={2} />
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
              <h6 className="fw-bold">Top 10 médecins</h6>
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
                    tickFormatter={(value: string) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
                  />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="recus" name="Reçus" stackId="a" fill="#198754" onClick={(e: any) => e && e.medecinId && handleMedecinDetail(e as unknown as MedecinItem)} />
                  <Bar dataKey="salleAttente" name="Salle d'attente" stackId="a" fill="#ffc107" onClick={(e: any) => e && e.medecinId && handleMedecinDetail(e as unknown as MedecinItem)} />
                  <Bar dataKey="transferts" name="Transferts" stackId="a" fill="#6c757d" onClick={(e: any) => e && e.medecinId && handleMedecinDetail(e as unknown as MedecinItem)} />
                  <Bar dataKey="constantes" name="Constantes" stackId="a" fill="#dc3545" onClick={(e: any) => e && e.medecinId && handleMedecinDetail(e as unknown as MedecinItem)} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Évolution mensuelle des RDV</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.parMoisRdv} onClick={(e: any) => e && e.activeLabel && handleMoisRdvDetail(e.activeLabel)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="confirmes" name="Confirmés" stroke="#198754" strokeWidth={2} />
                  <Line type="monotone" dataKey="reportes" name="Reportés" stroke="#ffc107" strokeWidth={2} />
                  <Line type="monotone" dataKey="annules" name="Annulés" stroke="#dc3545" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col>
          <Card className="border-0 shadow-sm overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Volume de consultations par jour</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.parJour} onClick={(e: any) => e && e.activeLabel && handleJourDetail(e.activeLabel)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Bar dataKey="total" name="Total consultations" fill="#0d6efd" onClick={(e: any) => e && e.jour && handleJourDetail(e.jour as string)} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl" fullscreen="lg-down">
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-list-check me-2"></i>{detailTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : detailItems.length === 0 ? (
            <div className="text-center text-muted py-5">Aucun élément trouvé.</div>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <Table striped bordered hover responsive size="sm">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Médecin</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Transfert</th>
                    <th>Constantes</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.patient}</td>
                      <td>{item.patientContact}</td>
                      <td>{item.medecin}</td>
                      <td>{item.date}</td>
                      <td>{item.heure}</td>
                      <td>{item.datetransfert || '-'}</td>
                      <td>
                        {item.constantes ? (
                          <Badge bg="success">Oui</Badge>
                        ) : (
                          <Badge bg="secondary">Non</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handlePrintDetails} disabled={detailLoading || detailItems.length === 0}>
            <i className="bi bi-printer me-2"></i>Imprimer
          </Button>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
