"use client";
import { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Spinner, Alert, Form, Button, ProgressBar, Table, Modal } from "react-bootstrap";
import { FaChartLine, FaChartBar, FaChartPie, FaUsers, FaCalendarAlt, FaStethoscope, FaHospital, FaDownload, FaArrowUp, FaArrowDown, FaFileInvoice } from "react-icons/fa";

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
  };
  tendances: {
    consultations: number;
    rendezVous: number;
    prescriptions: number;
    examens: number;
  };
  activiteHebdomadaire: { jour: string; consultations: number; rendezVous: number }[];
  repartitionActes: { type: string; count: number }[];
  performanceParService: { service: string; total: number; taux: number; statut: "Excellent" | "Correct" | "À surveiller" }[];
  progressionParMedecin: { medecin: string; specialite: string; actuel: number; precedent: number; objectif: number }[];
  progressionParActe: { acte: string; actuel: number; precedent: number; objectif: number }[];
  progressionIndicateurs: { indicateur: string; actuel: number; precedent: number; objectif: number; unite: string }[];
  alertesMetier: { libelle: string; valeur: string; niveau: "success" | "warning" | "danger" | "info" }[];
  actesExamensParMontant: { designation: string; montant: number; nombre: number; details: Record<string, any>[] }[];
  patientsConsultesParMedecin: { medecin: string; nombre: number; totalConsultations: number; details: Record<string, any>[] }[];
  recapMontantParAssurance: { assurance: string; montantExamens: number; montantConsultations: number; montantTotal: number; details: Record<string, any>[] }[];
  examensConsultationsParSexe: { sexe: string; consultations: number; examens: number; total: number; details: Record<string, any>[] }[];
}

export default function Statistique() {
  const [data, setData] = useState<StatistiqueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"medecin" | "admin">("medecin");
  const [dateDebut, setDateDebut] = useState(() => new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().slice(0, 10));
  const [detailTitle, setDetailTitle] = useState("");
  const [detailRows, setDetailRows] = useState<Record<string, any>[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  // Composants de graphiques personnalisés
  const CustomLineChart = ({ data, title }: { data: { date: string; total: number }[]; title: string }) => {
    const maxValue = Math.max(...data.map(d => d.total), 1);
    
    return (
      <div className="custom-chart">
        <h6 className="text-center mb-3">{title}</h6>
        <div className="chart-container">
          {data.map((item, index) => (
            <div key={index} className="chart-item">
              <div className="chart-label">{item.date}</div>
              <div className="chart-bar-container">
                <div 
                  className="chart-bar line-chart-bar"
                  style={{ 
                    height: `${(item.total / maxValue) * 100}%`,
                    background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
                  }}
                />
                <div className="chart-value">{item.total}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ClickableBarChart = ({ data, title, valueType = "number" }: { data: { label: string; value: number; details: Record<string, any>[] }[]; title: string; valueType?: "number" | "money" }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <div className="custom-chart">
        <h6 className="text-center mb-3">{title}</h6>
        <div className="chart-container">
          {data.map((item, index) => (
            <button key={index} type="button" className="chart-item chart-button" onClick={() => afficherDetails(item.label, item.details)}>
              <div className="chart-label">{item.label}</div>
              <div className="chart-bar-container">
                <div className="chart-bar bar-chart-bar" style={{ height: `${(item.value / maxValue) * 100}%` }} />
                <div className="chart-value">{valueType === "money" ? formatMontant(item.value) : item.value}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const ClickablePieChart = ({ data, title }: { data: { label: string; value: number; details: Record<string, any>[] }[]; title: string }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
    const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];

    return (
      <div className="custom-chart">
        <h6 className="text-center mb-3">{title}</h6>
        <div className="pie-chart-container">
          {data.map((item, index) => (
            <button key={index} type="button" className="pie-segment chart-button" onClick={() => afficherDetails(item.label, item.details)}>
              <div className="pie-legend">
                <div className="pie-color" style={{ backgroundColor: colors[index % colors.length] }} />
                <span>{item.label}</span>
                <Badge bg="secondary" className="ms-2">{((item.value / total) * 100).toFixed(1)}%</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CustomBarChart = ({ data, title }: { data: { week: string; count: number }[]; title: string }) => {
    const maxValue = Math.max(...data.map(d => d.count), 1);
    
    return (
      <div className="custom-chart">
        <h6 className="text-center mb-3">{title}</h6>
        <div className="chart-container">
          {data.map((item, index) => (
            <div key={index} className="chart-item">
              <div className="chart-label">{item.week}</div>
              <div className="chart-bar-container">
                <div 
                  className="chart-bar bar-chart-bar"
                  style={{ 
                    height: `${(item.count / maxValue) * 100}%`,
                    background: `linear-gradient(135deg, #36a2eb 0%, #4facfe 100%)`
                  }}
                />
                <div className="chart-value">{item.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CustomPieChart = ({ data, title }: { data: { type: string; count: number }[]; title: string }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
    const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0'];
    
    return (
      <div className="custom-chart">
        <h6 className="text-center mb-3">{title}</h6>
        <div className="pie-chart-container">
          <div className="pie-chart">
            {data.map((item, index) => {
              const percentage = (item.count / total) * 100;
              return (
                <div key={index} className="pie-segment">
                  <div className="pie-legend">
                    <div 
                      className="pie-color" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span>{item.type}</span>
                    <Badge bg="secondary" className="ms-2">{percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

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

      <Row className="g-4 mb-4">
        <Col xl={3} md={6}>
          <Card className="stat-card stat-card-primary border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaStethoscope className="text-primary mb-3" style={{ fontSize: "2rem" }} />
              <h3 className="mb-1">{data.kpis.consultationsJour}</h3>
              <p className="text-muted mb-0">Consultations de la Période</p>
              <div className="trend-badge trend-up mt-2">
                <FaArrowUp style={{ fontSize: "10px" }} />
                +{data.tendances.consultations}%
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="stat-card stat-card-warning border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaUsers className="text-warning mb-3" style={{ fontSize: "2rem" }} />
              <h3 className="mb-1">{data.kpis.patientsEnAttente}</h3>
              <p className="text-muted mb-0">Patients en attente</p>
              <div className="trend-badge trend-up mt-2">
                <FaArrowUp style={{ fontSize: "10px" }} />
                File active
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="stat-card stat-card-success border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaCalendarAlt className="text-success mb-3" style={{ fontSize: "2rem" }} />
              <h3 className="mb-1">{data.kpis.rendezVousJour}</h3>
              <p className="text-muted mb-0">Rendez-vous de la Période</p>
              <div className="trend-badge trend-up mt-2">
                <FaArrowUp style={{ fontSize: "10px" }} />
                +{data.tendances.rendezVous}%
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="stat-card stat-card-info border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <FaFileInvoice className="text-info mb-3" style={{ fontSize: "2rem" }} />
              <h3 className="mb-1">{data.kpis.prescriptionsEmises}</h3>
              <p className="text-muted mb-0">Prescriptions émises</p>
              <div className="trend-badge trend-up mt-2">
                <FaArrowUp style={{ fontSize: "10px" }} />
                +{data.tendances.prescriptions}%
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={4} lg={6}>
          <Card className="professional-stat-card border-0 shadow-sm h-100">
            <Card.Header className="professional-stat-header border-0">
              <h5 className="mb-0">
                <FaChartPie className="me-2" />
                Répartition des actes
              </h5>
            </Card.Header>
            <Card.Body>
              <CustomPieChart data={data.repartitionActes} title="Actes médicaux" />
            </Card.Body>
          </Card>
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
              <Button size="sm" variant="light" className="details-pill" onClick={() => afficherDetails("Montants par assurance", data.recapMontantParAssurance.flatMap(item => item.details))}>
                Détails
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="metric-summary mb-3">
                <span>Total assurances</span>
                <strong>{formatMontant(totalAssurances)}</strong>
              </div>
              <ClickablePieChart
                data={data.recapMontantParAssurance.map(item => ({ label: item.assurance, value: item.montantTotal, details: item.details }))}
                title="Répartition par assurance"
              />
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
              <Button size="sm" variant="light" className="details-pill" onClick={() => afficherDetails("Consultations par sexe", data.examensConsultationsParSexe.flatMap(item => item.details))}>
                Détails
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="metric-summary mb-3">
                <span>Total actes suivis</span>
                <strong>{data.examensConsultationsParSexe.reduce((sum, item) => sum + item.total, 0)}</strong>
              </div>
              <ClickablePieChart
                data={data.examensConsultationsParSexe.map(item => ({ label: item.sexe, value: item.total, details: item.details }))}
                title="Répartition par sexe"
              />
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

      <style jsx>{`
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
        
        .custom-chart {
          height: 300px;
          padding: 20px;
        }
        
        .chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 250px;
          padding: 20px 10px;
        }
        
        .chart-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: 80px;
        }
        
        .chart-button {
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0;
        }

        .chart-button:hover .chart-bar {
          filter: brightness(0.9);
          transform: scaleY(1.02);
        }

        .detail-row {
          cursor: pointer;
        }

        .detail-row:hover {
          background: #f0f9ff;
        }

        .chart-label {
          font-size: 12px;
          font-weight: 600;
          color: #6c757d;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .chart-bar-container {
          position: relative;
          width: 40px;
          height: 200px;
          display: flex;
          align-items: flex-end;
        }
        
        .chart-bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .chart-bar:hover {
          opacity: 0.8;
          transform: scaleY(1.05);
        }
        
        .line-chart-bar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        }
        
        .bar-chart-bar {
          background: linear-gradient(135deg, #36a2eb 0%, #4facfe 100%) !important;
        }
        
        .chart-value {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: 600;
          color: #495057;
          white-space: nowrap;
        }
        
        .pie-chart-container {
          padding: 20px;
        }
        
        .pie-chart {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .pie-segment {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border-radius: 8px;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }
        
        .pie-segment:hover {
          background: #e9ecef;
          transform: translateX(5px);
        }
        
        .pie-legend {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .pie-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
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
