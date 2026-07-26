'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { FaDoorOpen, FaUserPlus } from 'react-icons/fa';
import Admission, { type AvisHospit } from './Admission';
import GestionChambre from './GestionChambre';

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

export default function AvisHospitalisationPeriode() {
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [avis, setAvis] = useState<AvisHospit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAvis, setSelectedAvis] = useState<AvisHospit | null>(null);
  const [showAdmission, setShowAdmission] = useState(false);
  const [showGestionChambre, setShowGestionChambre] = useState(false);

  const loadAvis = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        statut: 'en_attente',
        dateInterventionDebut: dateDebut,
        dateInterventionFin: dateFin
      });
      const response = await fetch(`/api/avishospit?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Impossible de charger les avis d’hospitalisation');
      }

      setAvis(Array.isArray(data.data) ? data.data : []);
    } catch (loadError) {
      setAvis([]);
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les avis d’hospitalisation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvis();
  }, []);

  const patientLabel = (item: AvisHospit) => {
    if (typeof item.IDPARTIENT === 'object' && item.IDPARTIENT) {
      const fullName = [item.IDPARTIENT.Nom, item.IDPARTIENT.Prenoms].filter(Boolean).join(' ');
      return fullName || item.IDPARTIENT.Code_dossier || item.Patient || 'Patient';
    }
    return item.Patient || 'Patient';
  };

  const openAdmission = (item: AvisHospit) => {
    setSelectedAvis(item);
    setError('');
    setShowAdmission(true);
  };

  const handleAdmissionSuccess = async () => {
    setSuccess(selectedAvis ? `Admission de ${patientLabel(selectedAvis)} enregistrée` : 'Admission du patient enregistrée');
    setSelectedAvis(null);
    await loadAvis();
  };

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="mb-1">Avis d’hospitalisation à admettre</h5>
            <small className="text-muted">Liste des avis médicaux en attente, classés par date d’intervention.</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button variant="success" size="sm" onClick={() => { setSelectedAvis(null); setError(''); setShowAdmission(true); }}>
              <FaUserPlus className="me-1" /> Admettre un patient
            </Button>
            <Button variant="outline-primary" size="sm" onClick={() => setShowGestionChambre(true)}>
              <FaDoorOpen className="me-1" /> Gestion Chambre
            </Button>
            <Badge bg="primary" pill>{avis.length}</Badge>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
        {error && !showAdmission && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Form onSubmit={(event) => { event.preventDefault(); loadAvis(); }} className="mb-3">
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Label>Date d’intervention du</Form.Label>
              <Form.Control type="date" value={dateDebut} onChange={(event) => setDateDebut(event.target.value)} required />
            </Col>
            <Col md={4}>
              <Form.Label>Au</Form.Label>
              <Form.Control type="date" value={dateFin} min={dateDebut} onChange={(event) => setDateFin(event.target.value)} required />
            </Col>
            <Col md="auto">
              <Button type="submit" variant="outline-primary" disabled={loading}>Filtrer</Button>
            </Col>
          </Row>
        </Form>

        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" /> Chargement...</div>
        ) : avis.length === 0 ? (
          <Alert variant="light" className="mb-0 text-center">Aucun avis d’hospitalisation en attente pour cette période.</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Intervention</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Code prestation</th>
                  <th>État</th>
                  <th>Diagnostic</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {avis.map((item) => (
                  <tr key={item._id}>
                    <td>{formatDate(item.DateIntervention)}<br /><small className="text-muted">{item.HeureHospit || '—'}</small></td>
                    <td>{patientLabel(item)}</td>
                    <td><Badge bg="secondary">{item.serviceHospit || '—'}</Badge></td>
                    <td>{item.codePrestation || '—'}</td>
                    <td>{item.etatPatient || '—'}</td>
                    <td className="text-truncate" style={{ maxWidth: 240 }}>{item.Diagnostic || '—'}</td>
                    <td className="text-end"><Button size="sm" variant="success" onClick={() => openAdmission(item)}>Admettre</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      <Admission
        avis={selectedAvis}
        show={showAdmission}
        onHide={() => setShowAdmission(false)}
        onSuccess={handleAdmissionSuccess}
      />

      <GestionChambre show={showGestionChambre} onHide={() => setShowGestionChambre(false)} />
    </Card>
  );
}
