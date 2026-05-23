'use client';

import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Activity, Banknote, Bed, CalendarDays, RefreshCw, Stethoscope, Users } from 'lucide-react';
import { StatistiquesFilters } from '@/types/statistiques';
import { useStatistiques } from '@/hooks/useStatistiques';
import ClassementActes from '@/components/statistiques/ClassementActes';
import PrescriptionParMedecin from '@/components/statistiques/PrescriptionParMedecin';
import ResultatInterneExterne from '@/components/statistiques/ResultatInterneExterne';
import ExamenParSexe from '@/components/statistiques/ExamenParSexe';
import MontantActes from '@/components/statistiques/MontantActes';
import PatientsParMedecin from '@/components/statistiques/PatientsParMedecin';
import EvolutionConsultations from '@/components/statistiques/EvolutionConsultations';
import RepartitionHommeFemme from '@/components/statistiques/RepartitionHommeFemme';
import HospitalisationStats from '@/components/statistiques/HospitalisationStats';
import StatistiqueSkeleton from '@/components/statistiques/StatistiqueSkeleton';

const todayIso = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgoIso = () => new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function StatistiquesPage() {
  const initialFilters = useMemo<StatistiquesFilters>(() => ({
    dateDebut: thirtyDaysAgoIso(),
    dateFin: todayIso(),
    medecinId: '',
    service: '',
    typeExamen: '',
  }), []);

  const { data, filters, loading, error, setFilters, reload } = useStatistiques(initialFilters);
  const [formFilters, setFormFilters] = useState<StatistiquesFilters>(initialFilters);

  const formatMontant = (value: number) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

  const applyFilters = () => {
    setFilters(formFilters);
  };

  return (
    <Container fluid className="statistics-dashboard py-4">
      <div className="dashboard-hero mb-4">
        <div>
          <Badge bg="light" text="primary" className="mb-2 hero-badge">Easy Medical Analytics</Badge>
          <h1>Dashboard statistiques médicales</h1>
          <p>Vue décisionnelle dynamique des actes, prescriptions, examens, consultations et hospitalisations.</p>
        </div>
        <Button variant="light" className="refresh-button" onClick={reload} disabled={loading}>
          <RefreshCw size={18} className="me-2" />
          Actualiser
        </Button>
      </div>

      <Card className="filter-card border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xl={2} md={4}>
              <Form.Label>Date début</Form.Label>
              <Form.Control type="date" value={formFilters.dateDebut} onChange={(event) => setFormFilters({ ...formFilters, dateDebut: event.target.value })} />
            </Col>
            <Col xl={2} md={4}>
              <Form.Label>Date fin</Form.Label>
              <Form.Control type="date" value={formFilters.dateFin} onChange={(event) => setFormFilters({ ...formFilters, dateFin: event.target.value })} />
            </Col>
            <Col xl={2} md={4}>
              <Form.Label>Médecin</Form.Label>
              <Form.Control placeholder="ID médecin" value={formFilters.medecinId || ''} onChange={(event) => setFormFilters({ ...formFilters, medecinId: event.target.value })} />
            </Col>
            <Col xl={2} md={4}>
              <Form.Label>Service</Form.Label>
              <Form.Control placeholder="Service / acte" value={formFilters.service || ''} onChange={(event) => setFormFilters({ ...formFilters, service: event.target.value })} />
            </Col>
            <Col xl={2} md={4}>
              <Form.Label>Type d’examen</Form.Label>
              <Form.Control placeholder="Biologie, radio..." value={formFilters.typeExamen || ''} onChange={(event) => setFormFilters({ ...formFilters, typeExamen: event.target.value })} />
            </Col>
            <Col xl={2} md={4}>
              <Button className="w-100 filter-button" onClick={applyFilters} disabled={loading}>
                <CalendarDays size={18} className="me-2" />
                Filtrer
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="shadow-sm border-0">{error}</Alert>}
      {loading && <StatistiqueSkeleton />}

      {!loading && data && (
        <>
          <Row className="g-4 mb-4">
            <Col xl md={4} sm={6}>
              <Card className="kpi-card kpi-blue border-0 shadow-sm">
                <Card.Body>
                  <Stethoscope size={28} />
                  <span>Consultations</span>
                  <strong>{data.kpis.consultations}</strong>
                </Card.Body>
              </Card>
            </Col>
            <Col xl md={4} sm={6}>
              <Card className="kpi-card kpi-green border-0 shadow-sm">
                <Card.Body>
                  <Users size={28} />
                  <span>Patients</span>
                  <strong>{data.kpis.patients}</strong>
                </Card.Body>
              </Card>
            </Col>
            <Col xl md={4} sm={6}>
              <Card className="kpi-card kpi-purple border-0 shadow-sm">
                <Card.Body>
                  <Activity size={28} />
                  <span>Prescriptions bio</span>
                  <strong>{data.kpis.prescriptionsBiologiques}</strong>
                </Card.Body>
              </Card>
            </Col>
            <Col xl md={4} sm={6}>
              <Card className="kpi-card kpi-orange border-0 shadow-sm">
                <Card.Body>
                  <Banknote size={28} />
                  <span>Montant total</span>
                  <strong>{formatMontant(data.kpis.montantTotal)}</strong>
                </Card.Body>
              </Card>
            </Col>
            <Col xl md={4} sm={6}>
              <Card className="kpi-card kpi-cyan border-0 shadow-sm">
                <Card.Body>
                  <Bed size={28} />
                  <span>Hospitalisations</span>
                  <strong>{data.kpis.hospitalisations}</strong>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="charts-scroll-zone">
            <Row className="g-4">
              <Col xl={8} lg={12}>
                <EvolutionConsultations data={data.evolutionConsultations} />
              </Col>
              <Col xl={4} lg={6}>
                <RepartitionHommeFemme data={data.repartitionHommeFemme} />
              </Col>
              <Col xl={6} lg={6}>
                <ClassementActes data={data.classementActes} />
              </Col>
              <Col xl={6} lg={6}>
                <MontantActes data={data.montantActes} />
              </Col>
              <Col xl={6} lg={6}>
                <PatientsParMedecin data={data.patientsParMedecin} />
              </Col>
              <Col xl={6} lg={6}>
                <PrescriptionParMedecin data={data.prescriptionParMedecin} />
              </Col>
              <Col xl={4} lg={6}>
                <ExamenParSexe data={data.examenParSexe} />
              </Col>
              <Col xl={4} lg={6}>
                <ResultatInterneExterne data={data.resultatInterneExterne} />
              </Col>
              <Col xl={4} lg={12}>
                <HospitalisationStats data={data.hospitalisations} />
              </Col>
            </Row>
          </div>
        </>
      )}

      <style jsx global>{`
        .statistics-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #eef7ff 45%, #f0fdfa 100%);
        }

        .dashboard-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          color: #ffffff;
          border-radius: 28px;
          padding: 32px;
          background: linear-gradient(135deg, #0369a1 0%, #0f766e 100%);
          box-shadow: 0 24px 60px rgba(3, 105, 161, 0.24);
          animation: dashboardFadeIn 0.45s ease-out;
        }

        .dashboard-hero h1 {
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .dashboard-hero p {
          max-width: 780px;
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.82);
        }

        .hero-badge,
        .refresh-button,
        .filter-button {
          border-radius: 999px;
          font-weight: 700;
        }

        .filter-card,
        .stat-chart-card,
        .kpi-card {
          border-radius: 22px;
          animation: dashboardFadeIn 0.55s ease-out;
        }

        .filter-button {
          background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%);
          border: 0;
          min-height: 42px;
        }

        .kpi-card {
          color: #ffffff;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .kpi-card:hover,
        .stat-chart-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12) !important;
        }

        .kpi-card .card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 138px;
        }

        .kpi-card span {
          color: rgba(255, 255, 255, 0.82);
          font-weight: 700;
        }

        .kpi-card strong {
          font-size: 1.45rem;
          line-height: 1.2;
        }

        .kpi-blue { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
        .kpi-green { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
        .kpi-purple { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); }
        .kpi-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
        .kpi-cyan { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); }

        .charts-scroll-zone {
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          padding-right: 6px;
          scroll-behavior: smooth;
        }

        .stat-chart-card {
          background: rgba(255, 255, 255, 0.96);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .chart-title {
          margin-bottom: 18px;
          color: #0f172a;
          font-size: 1rem;
          font-weight: 800;
        }

        .skeleton-card {
          border-radius: 22px;
          overflow: hidden;
        }

        .skeleton-line,
        .skeleton-block {
          position: relative;
          overflow: hidden;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .skeleton-line::after,
        .skeleton-block::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent);
          animation: shimmer 1.4s infinite;
        }

        .skeleton-title {
          width: 65%;
          height: 16px;
          margin-bottom: 20px;
        }

        .skeleton-value {
          width: 42%;
          height: 32px;
        }

        .skeleton-block {
          width: 100%;
          height: 260px;
          border-radius: 18px;
        }

        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }

        @keyframes dashboardFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .dashboard-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 24px;
          }

          .charts-scroll-zone {
            max-height: none;
            overflow: visible;
          }
        }
      `}</style>
    </Container>
  );
}
