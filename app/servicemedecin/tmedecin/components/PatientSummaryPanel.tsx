'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import { FaExclamationTriangle, FaHeartbeat, FaHistory, FaNotesMedical, FaSyncAlt } from 'react-icons/fa';
import { MedicalAlertLevel, PatientSummary } from '@/types/patientSummary';

interface PatientSummaryPanelProps {
  patientId: string;
}

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR') : 'Non renseigné';

const alertVariant: Record<MedicalAlertLevel, string> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
};

const eventLabels = {
  consultation: 'Consultation',
  prescription: 'Prescription',
  biologie: 'Biologie',
  radiologie: 'Radiologie',
  hospitalisation: 'Hospitalisation',
};

export default function PatientSummaryPanel({ patientId }: PatientSummaryPanelProps) {
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/patients/${patientId}/summary`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossible de charger la synthèse');
      setSummary(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger la synthèse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadSummary();
  }, [patientId]);

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /><div className="mt-2">Génération de la synthèse...</div></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}<Button variant="outline-danger" size="sm" className="ms-3" onClick={loadSummary}>Réessayer</Button></Alert>;
  }

  if (!summary) return null;

  const histories = [
    ['Médicaux', summary.history.medical],
    ['Chirurgicaux', summary.history.surgical],
    ['Familiaux', summary.history.family],
    ['Autres', summary.history.other],
  ].filter(([, value]) => value);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">Synthèse du dossier</h5>
          <small className="text-muted">Mise à jour le {new Date(summary.generatedAt).toLocaleString('fr-FR')}</small>
        </div>
        <Button variant="outline-primary" size="sm" onClick={loadSummary}><FaSyncAlt className="me-1" />Actualiser</Button>
      </div>

      <Card className="mb-3 border-primary">
        <Card.Body>
          <Row>
            <Col md={4}><strong>{summary.patient.fullName}</strong><div>{summary.patient.sex || 'Sexe non renseigné'} — {summary.patient.age ?? 'Âge non renseigné'}{typeof summary.patient.age === 'number' ? ' ans' : ''}</div></Col>
            <Col md={4}><strong>Dossier</strong><div>{summary.patient.fileNumber}</div><div>Né(e) le {formatDate(summary.patient.birthDate)}</div></Col>
            <Col md={4}><strong>Contact / Assurance</strong><div>{summary.patient.contact || 'Non renseigné'}</div><div>{summary.patient.insurance || 'Non renseignée'}</div></Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header className="fw-bold"><FaExclamationTriangle className="me-2 text-danger" />Vigilances</Card.Header>
        <Card.Body>
          {summary.vigilance.alerts.length === 0 && <Alert variant="success" className="mb-2">Aucune alerte détectée par les règles disponibles.</Alert>}
          {summary.vigilance.alerts.map((alert) => <Alert key={alert.code} variant={alertVariant[alert.level]} className="py-2 mb-2">{alert.label}</Alert>)}
          {summary.vigilance.missingInformation.length > 0 && (
            <Alert variant="secondary" className="mb-0"><strong>Informations à compléter :</strong> {summary.vigilance.missingInformation.join(' • ')}</Alert>
          )}
        </Card.Body>
      </Card>

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header className="fw-bold"><FaNotesMedical className="me-2" />Antécédents</Card.Header>
            <Card.Body>
              {histories.length === 0 ? <span className="text-muted">Non renseignés</span> : histories.map(([label, value]) => <div key={label} className="mb-2"><strong>{label} :</strong> {value}</div>)}
              <div className="mt-2"><strong>Allergies :</strong> {summary.vigilance.allergies || <span className="text-muted">Non renseignées</span>}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header className="fw-bold"><FaHeartbeat className="me-2" />Dernières constantes</Card.Header>
            <Card.Body>
              {!summary.latestVitals ? <span className="text-muted">Aucune constante disponible</span> : (
                <>
                  <div className="text-muted mb-2">Mesurées le {formatDate(summary.latestVitals.date)}</div>
                  <Table size="sm" className="mb-0"><tbody>
                    <tr><th>Température</th><td>{summary.latestVitals.temperature ? `${summary.latestVitals.temperature} °C` : '-'}</td></tr>
                    <tr><th>Tension</th><td>{summary.latestVitals.bloodPressure ? `${summary.latestVitals.bloodPressure} mmHg` : '-'}</td></tr>
                    <tr><th>Pouls</th><td>{summary.latestVitals.pulse ? `${summary.latestVitals.pulse} bpm` : '-'}</td></tr>
                    <tr><th>Poids</th><td>{summary.latestVitals.weight ? `${summary.latestVitals.weight} kg` : '-'}</td></tr>
                  </tbody></Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-2 mb-3">
        {Object.entries(summary.counts).map(([key, value]) => (
          <Col key={key} xs={6} md><Card className="text-center h-100"><Card.Body className="py-2"><div className="fs-4 fw-bold text-primary">{value}</div><small>{({ consultations: 'Consultations', prescriptions: 'Prescriptions', biologicalExams: 'Biologie', radiologyReports: 'Radiologie', hospitalisations: 'Hospitalisations' } as Record<string, string>)[key]}</small></Card.Body></Card></Col>
        ))}
      </Row>

      <Card className="mb-3">
        <Card.Header className="fw-bold"><FaHistory className="me-2" />Dernière consultation</Card.Header>
        <Card.Body>
          {!summary.latestConsultation ? <span className="text-muted">Aucune consultation</span> : (
            <Row>
              <Col md={4}><strong>Date :</strong> {formatDate(summary.latestConsultation.date)}<br /><strong>Médecin :</strong> {summary.latestConsultation.doctor || '-'}</Col>
              <Col md={8}><strong>Motif :</strong> {summary.latestConsultation.reason || '-'}<br /><strong>Diagnostic :</strong> {summary.latestConsultation.diagnosis || '-'}<br /><strong>Conclusion :</strong> {summary.latestConsultation.conclusion || '-'}</Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="fw-bold">Événements récents</Card.Header>
        <Card.Body className="p-0">
          {summary.recentEvents.length === 0 ? <div className="p-3 text-muted">Aucun événement récent</div> : (
            <Table responsive hover className="mb-0"><thead><tr><th>Date</th><th>Type</th><th>Événement</th><th>Statut</th></tr></thead><tbody>
              {summary.recentEvents.map((event) => <tr key={`${event.type}-${event.id}`}><td>{formatDate(event.date)}</td><td><Badge bg="secondary">{eventLabels[event.type]}</Badge></td><td><strong>{event.title}</strong>{event.detail && <div className="small text-muted">{event.detail}</div>}</td><td>{event.status || '-'}</td></tr>)}
            </tbody></Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
