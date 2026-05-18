"use client";
import { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Spinner, Alert, Form, Button, ProgressBar, Table } from "react-bootstrap";
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
}

export default function Statistique() {
  const [data, setData] = useState<StatistiqueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"medecin" | "admin">("medecin");

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

      if (profil) {
        const medecinsResponse = await fetch('/api/medecins');

        if (medecinsResponse.ok) {
          const allMedecins = await medecinsResponse.json();
          const connectedMedecin = allMedecins.find((medecin: any) =>
            medecin._id?.toString() === profil._id ||
            medecin.userId?.toString() === profil._id ||
            (medecin.nom === profil.nom && medecin.prenoms === profil.prenom)
          );

          if (connectedMedecin?._id) {
            params.set("medecinId", connectedMedecin._id);
          }
        }
      }

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaChartLine className="me-2" />
            Statistiques métier {viewMode === "admin" ? "administrateur" : "médecin"}
          </h2>
          <p className="text-muted mb-0">
            Pilotage professionnel de l'activité médicale, des consultations et du suivi patient
          </p>
        </div>
        <div className="d-flex gap-3">
          <Form.Group className="mb-0">
            <Form.Label>Période</Form.Label>
            <Form.Select size="sm" style={{ width: "150px" }}>
              <option>30 derniers jours</option>
              <option>3 derniers mois</option>
              <option>6 derniers mois</option>
              <option>1 année</option>
            </Form.Select>
          </Form.Group>
          <Button variant="outline-primary" size="sm">
            <FaDownload className="me-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={3} sm={6}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaStethoscope className="text-primary mb-3" style={{ fontSize: "2rem" }} />
              <h3 className="mb-1">{data.kpis.consultationsJour}</h3>
              <p className="text-muted mb-0">Consultations du jour</p>
              <div className="trend-badge trend-up mt-2">
                <FaArrowUp style={{ fontSize: "10px" }} />
                +{data.tendances.consultations}%
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card border-0 shadow-sm">
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
        <Col md={3} sm={6}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaCalendarAlt className="text-success mb-3" style={{ fontSize: "2rem" }} />
              <h3 className="mb-1">{data.kpis.rendezVousJour}</h3>
              <p className="text-muted mb-0">Rendez-vous du jour</p>
              <div className="trend-badge trend-up mt-2">
                <FaArrowUp style={{ fontSize: "10px" }} />
                +{data.tendances.rendezVous}%
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card border-0 shadow-sm">
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

      <Row className="mb-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Activité médicale hebdomadaire
              </h5>
            </Card.Header>
            <Card.Body>
              <CustomLineChart data={data.activiteHebdomadaire.map(item => ({ date: item.jour, total: item.consultations }))} title="Consultations réalisées" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
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
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaChartBar className="me-2" />
                Rendez-vous hebdomadaires
              </h5>
            </Card.Header>
            <Card.Body>
              <CustomBarChart data={data.activiteHebdomadaire.map(item => ({ week: item.jour, count: item.rendezVous }))} title="Rendez-vous planifiés" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaHospital className="me-2" />
                Indicateurs de qualité
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Dossiers finalisés</span>
                  <strong>{data.kpis.tauxCompletion}%</strong>
                </div>
                <ProgressBar now={data.kpis.tauxCompletion} variant="success" />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Patients reçus</span>
                  <strong>{data.kpis.patientsRecus}/{data.kpis.consultationsJour}</strong>
                </div>
                <ProgressBar now={(data.kpis.patientsRecus / data.kpis.consultationsJour) * 100} variant="info" />
              </div>
              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Temps moyen consultation</span>
                  <strong>{data.kpis.tempsMoyenConsultation} min</strong>
                </div>
                <ProgressBar now={70} variant="primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
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
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
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

      <Row className="mt-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
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

      <Row className="mt-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
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
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
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

      <style jsx>{`
        .stat-card {
          transition: transform 0.2s ease-in-out;
        }
        .stat-card:hover {
          transform: translateY(-5px);
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
      `}</style>
    </div>
  );
}
