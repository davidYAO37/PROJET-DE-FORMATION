"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Table, Badge } from "react-bootstrap";
import { FaCalendarAlt, FaSearch, FaUndo, FaClock, FaCheckCircle, FaEdit, FaHourglassHalf, FaStethoscope, FaVenusMars, FaChartBar } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import LicenceModuleGuard from "@/components/licence/LicenceModuleGuard";

interface RadioStats {
  totalExamens: number;
  aSaisir: number;
  enAttente: number;
  valides: number;
  parMois: { mois: string; total: number; valides: number; attente: number; asaisir: number }[];
  parLettreCle: { lettreCle: string; total: number }[];
  parMedecinExecutant: { medecin: string; total: number }[];
  parSexe: { sexe: string; total: number }[];
  delaiMoyenSaisie: number;
  delaiMoyenValidation: number;
}

const COLORS = ['#0d6efd', '#0dcaf0', '#198754', '#fd7e14', '#dc3545', '#6f42c1', '#20c997', '#ffc107'];

export default function StatistiquesRadioPage() {
  const [stats, setStats] = useState<RadioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const loadStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("dateDebut", dateDebut);
      if (dateFin) params.append("dateFin", dateFin);

      const response = await fetch(`/api/compteRenduRadio/statistiques?${params}`);
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [dateDebut, dateFin]);

  const handleReset = () => {
    setDateDebut("");
    setDateFin("");
  };

  const kpiCards = [
    { title: "Examens réalisés", value: stats?.totalExamens ?? 0, icon: <FaStethoscope size={24} />, color: "#0d6efd" },
    { title: "À saisir", value: stats?.aSaisir ?? 0, icon: <FaEdit size={24} />, color: "#dc3545" },
    { title: "En attente", value: stats?.enAttente ?? 0, icon: <FaHourglassHalf size={24} />, color: "#fd7e14" },
    { title: "Validés", value: stats?.valides ?? 0, icon: <FaCheckCircle size={24} />, color: "#198754" },
  ];

  return (
    <LicenceModuleGuard module="radio">
      <Container fluid className="p-4">
        <Card className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%)' }}>
          <Card.Body className="text-white py-4">
            <Row className="align-items-center">
              <Col>
                <h2 className="mb-0 fw-bold d-flex align-items-center">
                  <FaChartBar className="me-3" />
                  Statistiques — Service Imagerie / Radiologie
                </h2>
                <p className="mb-0 opacity-75 mt-2">
                  Tableau de bord métier pour la gestion administrative du service
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col xs={12} md={4}>
                <Form.Label className="text-muted small fw-semibold">Date début</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaCalendarAlt className="text-primary" />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="border-start-0"
                  />
                </InputGroup>
              </Col>
              <Col xs={12} md={4}>
                <Form.Label className="text-muted small fw-semibold">Date fin</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <FaCalendarAlt className="text-primary" />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="border-start-0"
                  />
                </InputGroup>
              </Col>
              <Col xs={12} md={4}>
                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={loadStats} disabled={loading} className="d-flex align-items-center">
                    {loading ? <Spinner size="sm" /> : <FaSearch className="me-2" />}
                    Actualiser
                  </Button>
                  <Button variant="outline-secondary" onClick={handleReset} className="d-flex align-items-center">
                    <FaUndo />
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row className="g-3 mb-4">
          {kpiCards.map((kpi, idx) => (
            <Col key={idx} xs={12} sm={6} xl={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ borderLeft: `4px solid ${kpi.color}` }}>
                <Card.Body className="d-flex align-items-center p-3">
                  <div className="me-3" style={{ color: kpi.color }}>{kpi.icon}</div>
                  <div>
                    <h6 className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{kpi.title}</h6>
                    <h3 className="mb-0 fw-bold">{loading ? <Spinner size="sm" /> : kpi.value}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="g-4 mb-4">
          <Col xl={8}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold text-primary">Activité par mois</h5>
              </Card.Header>
              <Card.Body>
                {loading || !stats ? (
                  <div className="text-center py-5"><Spinner /></div>
                ) : stats.parMois.length === 0 ? (
                  <p className="text-muted text-center py-5">Aucune donnée pour la période</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.parMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="valides" name="Validés" fill="#198754" />
                      <Bar dataKey="attente" name="En attente" fill="#fd7e14" />
                      <Bar dataKey="asaisir" name="À saisir" fill="#dc3545" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col xl={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold text-info">Répartition par type d&apos;examen</h5>
              </Card.Header>
              <Card.Body>
                {loading || !stats ? (
                  <div className="text-center py-5"><Spinner /></div>
                ) : stats.parLettreCle.length === 0 ? (
                  <p className="text-muted text-center py-5">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.parLettreCle}
                        dataKey="total"
                        nameKey="lettreCle"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {stats.parLettreCle.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mb-4">
          <Col xl={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold text-warning">Examens par médecin exécutant</h5>
              </Card.Header>
              <Card.Body>
                {loading || !stats ? (
                  <div className="text-center py-5"><Spinner /></div>
                ) : stats.parMedecinExecutant.length === 0 ? (
                  <p className="text-muted text-center py-5">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.parMedecinExecutant} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="medecin" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="total" name="Examens" fill="#0dcaf0" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col xl={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold text-success">Répartition par sexe</h5>
              </Card.Header>
              <Card.Body>
                {loading || !stats ? (
                  <div className="text-center py-5"><Spinner /></div>
                ) : stats.parSexe.length === 0 ? (
                  <p className="text-muted text-center py-5">Aucune donnée</p>
                ) : (
                  <Row className="align-items-center h-100">
                    {stats.parSexe.map((item, idx) => (
                      <Col key={idx} xs={6} className="text-center">
                        <div className="mb-2" style={{ fontSize: '2.5rem', color: COLORS[idx % COLORS.length] }}>
                          <FaVenusMars />
                        </div>
                        <h4 className="fw-bold">{item.total}</h4>
                        <Badge bg={item.sexe.toLowerCase() === 'm' ? 'primary' : item.sexe.toLowerCase() === 'f' ? 'danger' : 'secondary'}>
                          {item.sexe}
                        </Badge>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-white border-0 py-3">
            <h5 className="mb-0 fw-bold text-dark">Délais moyens</h5>
          </Card.Header>
          <Card.Body>
            <Table bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Indicateur</th>
                  <th>Valeur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><FaClock className="me-2 text-primary" />Délai moyen entre examen et saisie du résultat</td>
                  <td className="fw-bold">
                    {loading || !stats ? <Spinner size="sm" /> : `${stats.delaiMoyenSaisie} heure(s)`}
                  </td>
                </tr>
                <tr>
                  <td><FaCheckCircle className="me-2 text-success" />Délai moyen entre saisie et validation</td>
                  <td className="fw-bold">
                    {loading || !stats ? <Spinner size="sm" /> : `${stats.delaiMoyenValidation} heure(s)`}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </LicenceModuleGuard>
  );
}
