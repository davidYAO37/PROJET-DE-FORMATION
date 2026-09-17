"use client";

import { Card, Row, Col, ProgressBar } from 'react-bootstrap';

interface RdvItem {
  _id: string;
  StatutRdv: string;
  Statutrdvpris: boolean;
  PatientR?: string;
  DateDisponinibilite?: string;
}

interface PlanningItem {
  _id: string;
  TotalRDV?: number;
  ResteRDV?: number;
  Dureconsul?: number;
  heureDebut?: string;
  HeureFin?: string;
}

interface RdvStatisticsProps {
  rendezVous: RdvItem[];
  plannings: PlanningItem[];
}

export default function RdvStatistics({ rendezVous, plannings }: RdvStatisticsProps) {
  const totalRdv = rendezVous.length;
  const pris = rendezVous.filter(r => r.Statutrdvpris).length;
  const presents = rendezVous.filter(r => r.StatutRdv === '2').length;
  const enCours = rendezVous.filter(r => r.StatutRdv === '1').length;
  const annules = rendezVous.filter(r => r.StatutRdv === '3').length;
  const reportes = rendezVous.filter(r => r.StatutRdv === '4').length;
  const disponibles = rendezVous.filter(r => !r.Statutrdvpris).length;

  const totalPlaces = plannings.reduce((sum, p) => sum + (p.TotalRDV || 0), 0);
  const restePlaces = plannings.reduce((sum, p) => sum + (p.ResteRDV || 0), 0);

  const tauxOccupation = totalPlaces > 0 ? Math.round((pris / totalPlaces) * 100) : 0;
  const tauxPresence = pris > 0 ? Math.round((presents / pris) * 100) : 0;
  const tauxAnnulation = pris > 0 ? Math.round((annules / pris) * 100) : 0;
  const tauxReport = pris > 0 ? Math.round((reportes / pris) * 100) : 0;

  const statCards = [
    { label: 'Rendez-vous', value: totalRdv, color: 'primary' },
    { label: 'Pris', value: pris, color: 'info' },
    { label: 'Disponibles', value: disponibles, color: 'secondary' },
    { label: 'Présents', value: presents, color: 'success' },
    { label: 'En cours', value: enCours, color: 'primary' },
    { label: 'Annulés', value: annules, color: 'danger' },
    { label: 'Reportés', value: reportes, color: 'warning' },
  ];

  return (
    <div>
      <Row className="g-3 mb-4">
        {statCards.map((stat, idx) => (
          <Col key={idx} xs={6} md={4} lg={3}>
            <Card className={`border-0 shadow-sm h-100 border-start border-4 border-${stat.color}`}>
              <Card.Body className="text-center p-3">
                <h3 className={`mb-1 text-${stat.color}`}>{stat.value}</h3>
                <small className="text-muted">{stat.label}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="fw-bold mb-3">Taux d&apos;occupation</h6>
              <div className="d-flex justify-content-between mb-1">
                <small>Places prises</small>
                <small className="fw-bold">{pris} / {totalPlaces}</small>
              </div>
              <ProgressBar now={tauxOccupation} variant="info" className="mb-3" />

              <h6 className="fw-bold mb-3">Taux de présence</h6>
              <div className="d-flex justify-content-between mb-1">
                <small>Présents / pris</small>
                <small className="fw-bold">{presents} / {pris}</small>
              </div>
              <ProgressBar now={tauxPresence} variant="success" />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="fw-bold mb-3">Taux d&apos;annulation</h6>
              <div className="d-flex justify-content-between mb-1">
                <small>Annulés / pris</small>
                <small className="fw-bold">{annules} / {pris}</small>
              </div>
              <ProgressBar now={tauxAnnulation} variant="danger" className="mb-3" />

              <h6 className="fw-bold mb-3">Taux de report</h6>
              <div className="d-flex justify-content-between mb-1">
                <small>Reportés / pris</small>
                <small className="fw-bold">{reportes} / {pris}</small>
              </div>
              <ProgressBar now={tauxReport} variant="warning" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-3">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="fw-bold mb-3">Capacité du planning</h6>
              <div className="d-flex justify-content-between">
                <div className="text-center flex-fill">
                  <h4 className="text-primary">{totalPlaces}</h4>
                  <small className="text-muted">Places totales</small>
                </div>
                <div className="text-center flex-fill">
                  <h4 className="text-success">{pris}</h4>
                  <small className="text-muted">Occupées</small>
                </div>
                <div className="text-center flex-fill">
                  <h4 className="text-secondary">{restePlaces}</h4>
                  <small className="text-muted">Restantes</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
