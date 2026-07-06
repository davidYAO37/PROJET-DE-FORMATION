'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col, Table, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaHeartbeat, FaSave, FaHistory, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

interface SelectedHospit {
  _id?: string;
  CodePrestation?: string;
  Code_dossier?: string;
  PatientP?: string;
  SortieLe?: string | null;
}

interface ConstantesVitalesModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  codeDossier?: string;
  hospitalisationId?: string;
  codePrestation?: string;
  selectedHospit?: SelectedHospit | null;
}

interface Observation {
  _id: string;
  Date?: string;
  Heure?: string;
  Temperature?: string;
  Tension?: string;
  Poids?: string;
  Glycemie?: string;
  TailleCons?: string;
  ObservationC?: string;
  Intervenant?: string;
  Patient?: string | { _id?: string; Nom?: string; Prenoms?: string };
  Hospitalisation?: string | { _id?: string };
  Code_dossier?: string;
  CodePrestation?: string;
  createdAt?: string;
  updatedAt?: string;
}

const formatDateInput = (d?: Date | string): string => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeInput = (d?: Date | string): string => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const getPatientName = (patientNom?: string, patientPrenoms?: string) => {
  return `${patientNom || ''} ${patientPrenoms || ''}`.trim();
};

export default function ConstantesVitalesModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
  codeDossier,
  hospitalisationId,
  codePrestation,
  selectedHospit,
}: ConstantesVitalesModalProps) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('nom_utilisateur') || '');
    }
  }, []);

  const [observationId, setObservationId]       = useState<string | null>(null);
  const [date, setDate]                         = useState('');
  const [heure, setHeure]                       = useState('');
  const [temperature, setTemperature]           = useState('');
  const [tension, setTension]                   = useState('');
  const [poids, setPoids]                       = useState('');
  const [glycemie, setGlycemie]                 = useState('');
  const [taille, setTaille]                     = useState('');
  const [observation, setObservation]           = useState('');
  const [intervenant, setIntervenant]           = useState('');
  const [codePrestLocal, setCodePrestLocal]     = useState('');
  const [codeDossierLocal, setCodeDossierLocal] = useState('');

  const [loading, setLoading]                   = useState(false);
  const [loadingDelete, setLoadingDelete]       = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [historique, setHistorique]             = useState<Observation[]>([]);
  const [loadingHistory, setLoadingHistory]     = useState(false);
  const [activeTab, setActiveTab]               = useState<'saisie' | 'historique'>('saisie');

  useEffect(() => {
    if (show) {
      setError(null);
      setActiveTab('saisie');
      setObservationId(null);
      const now = new Date();
      setDate(formatDateInput(now));
      setHeure(formatTimeInput(now));
      setTemperature('');
      setTension('');
      setPoids('');
      setGlycemie('');
      setTaille('');
      setObservation('');
      setCodeDossierLocal(codeDossier || '');
      setCodePrestLocal(codePrestation || selectedHospit?.CodePrestation || '');
      setIntervenant(userName);

      if (patientId || hospitalisationId) {
        chargerHistorique();
      }
    }
  }, [show, patientId, hospitalisationId, codeDossier, codePrestation, selectedHospit, userName]);

  const chargerHistorique = async () => {
    setLoadingHistory(true);
    try {
      const url = hospitalisationId
        ? `/api/observations?hospitalisationId=${hospitalisationId}`
        : `/api/observations?patientId=${patientId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistorique(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json();
        setError(err?.error || 'Erreur chargement historique');
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setError('Erreur réseau lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetForm = () => {
    setObservationId(null);
    const now = new Date();
    setDate(formatDateInput(now));
    setHeure(formatTimeInput(now));
    setTemperature('');
    setTension('');
    setPoids('');
    setGlycemie('');
    setTaille('');
    setObservation('');
    setIntervenant(userName);
  };

  const editerObservation = (obs: Observation) => {
    setError(null);
    setObservationId(obs._id);
    setDate(formatDateInput(obs.Date || obs.createdAt || new Date()));
    setHeure(obs.Heure || formatTimeInput(obs.createdAt || new Date()));
    setTemperature(obs.Temperature || '');
    setTension(obs.Tension || '');
    setPoids(obs.Poids || '');
    setGlycemie(obs.Glycemie || '');
    setTaille(obs.TailleCons || '');
    setObservation(obs.ObservationC || '');
    setIntervenant(obs.Intervenant || userName);
    setCodeDossierLocal(obs.Code_dossier || codeDossier || '');
    setCodePrestLocal(obs.CodePrestation || codePrestation || selectedHospit?.CodePrestation || '');
    setActiveTab('saisie');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const message = observationId
      ? 'Voulez-vous modifier cette observation ?'
      : 'Voulez-vous ajouter cette observation ?';
    if (!confirm(message)) return;

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        Patient: patientId,
        Hospitalisation: hospitalisationId,
        Code_dossier: codeDossierLocal,
        CodePrestation: codePrestLocal,
        Date: date ? new Date(date).toISOString() : new Date().toISOString(),
        Heure: heure,
        Temperature: temperature,
        Tension: tension,
        Poids: poids,
        Glycemie: glycemie,
        TailleCons: taille,
        ObservationC: observation,
        Intervenant: intervenant,
      };

      let res;
      if (observationId) {
        res = await fetch(`/api/observations/${observationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/observations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        resetForm();
        await chargerHistorique();
        setActiveTab('historique');
      } else {
        const err = await res.json();
        setError(err?.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur enregistrement observation:', error);
      setError('Erreur réseau lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (obs: Observation) => {
    if (!confirm('Voulez-vous supprimer cette observation ?')) return;

    setLoadingDelete(true);
    setError(null);
    try {
      const res = await fetch(`/api/observations/${obs._id}`, { method: 'DELETE' });
      if (res.ok) {
        if (observationId === obs._id) resetForm();
        await chargerHistorique();
      } else {
        const err = await res.json();
        setError(err?.error || 'Erreur suppression');
      }
    } catch (error) {
      console.error('Erreur suppression observation:', error);
      setError('Erreur réseau lors de la suppression');
    } finally {
      setLoadingDelete(false);
    }
  };

  const title = observationId ? 'Modifier la fiche' : 'Nouvelle fiche';

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaHeartbeat className="me-2" />
          FICHE D'OBSERVATION — {getPatientName(patientNom, patientPrenoms)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

        <div className="d-flex mb-3 gap-2">
          <Button
            variant={activeTab === 'saisie' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => { setError(null); setActiveTab('saisie'); }}
          >
            <FaPlus className="me-1" /> {title}
          </Button>
          <Button
            variant={activeTab === 'historique' ? 'secondary' : 'outline-secondary'}
            size="sm"
            onClick={() => { setError(null); setActiveTab('historique'); }}
          >
            <FaHistory className="me-1" />
            Historique
            {historique.length > 0 && (
              <Badge bg="light" text="dark" className="ms-2">{historique.length}</Badge>
            )}
          </Button>
        </div>

        {activeTab === 'saisie' && (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={5}>
                <Form.Group className="mb-2">
                  <Form.Label className="fw-bold">Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="fw-bold">Heure</Form.Label>
                  <Form.Control
                    type="time"
                    value={heure}
                    onChange={(e) => setHeure(e.target.value)}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold">Code Dossier</Form.Label>
                      <Form.Control
                        type="text"
                        value={codeDossierLocal}
                        onChange={(e) => setCodeDossierLocal(e.target.value)}
                        placeholder="Code dossier"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold">Code Prestation</Form.Label>
                      <Form.Control
                        type="text"
                        value={codePrestLocal}
                        onChange={(e) => setCodePrestLocal(e.target.value)}
                        placeholder="Code prestation"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-bold">Patient</Form.Label>
                  <Form.Control
                    type="text"
                    value={getPatientName(patientNom, patientPrenoms)}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-bold">Intervenant</Form.Label>
                  <Form.Control
                    type="text"
                    value={intervenant}
                    onChange={(e) => setIntervenant(e.target.value)}
                    readOnly={!!userName}
                    className={userName ? 'bg-light' : ''}
                    placeholder="Nom de l'intervenant"
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold">Température</Form.Label>
                      <Form.Control
                        type="text"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="ex: 37.5"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold">Tension</Form.Label>
                      <Form.Control
                        type="text"
                        value={tension}
                        onChange={(e) => setTension(e.target.value)}
                        placeholder="ex: 120/80"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold">Glycémie</Form.Label>
                      <Form.Control
                        type="text"
                        value={glycemie}
                        onChange={(e) => setGlycemie(e.target.value)}
                        placeholder="ex: 1.1"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold">Taille</Form.Label>
                      <Form.Control
                        type="text"
                        value={taille}
                        onChange={(e) => setTaille(e.target.value)}
                        placeholder="ex: 170"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-bold">Poids</Form.Label>
                  <Form.Control
                    type="text"
                    value={poids}
                    onChange={(e) => setPoids(e.target.value)}
                    placeholder="ex: 70"
                  />
                </Form.Group>
              </Col>

              <Col md={7}>
                <Form.Group className="h-100 d-flex flex-column">
                  <Form.Label className="fw-bold">Observation</Form.Label>
                  <Form.Control
                    as="textarea"
                    className="flex-grow-1"
                    style={{ minHeight: 320, resize: 'none' }}
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Saisir l'observation médicale..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="text-end mt-3">
              <Button variant="secondary" onClick={onHide} className="me-2">Fermer</Button>
              {observationId && (
                <Button variant="outline-secondary" onClick={resetForm} className="me-2">
                  <FaPlus className="me-1" /> Nouveau
                </Button>
              )}
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enregistrement...</>
                ) : (
                  <><FaSave className="me-2" />Enregistrer</>
                )}
              </Button>
            </div>
          </Form>
        )}

        {activeTab === 'historique' && (
          <>
            {loadingHistory ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : historique.length === 0 ? (
              <p className="text-center text-muted py-4">Aucune fiche enregistrée pour ce patient.</p>
            ) : (
              <div className="table-responsive">
                <Table bordered hover size="sm" className="text-center">
                  <thead className="table-primary">
                    <tr>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Intervenant</th>
                      <th>Temp.</th>
                      <th>Tension</th>
                      <th>Poids</th>
                      <th>Glycémie</th>
                      <th>Taille</th>
                      <th>Observation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map((obs) => (
                      <tr key={obs._id}>
                        <td>{formatDateDisplay(obs.Date || obs.createdAt)}</td>
                        <td>{obs.Heure || '—'}</td>
                        <td>{obs.Intervenant || '—'}</td>
                        <td>{obs.Temperature ? `${obs.Temperature}°C` : '—'}</td>
                        <td>{obs.Tension || '—'}</td>
                        <td>{obs.Poids ? `${obs.Poids} kg` : '—'}</td>
                        <td>{obs.Glycemie || '—'}</td>
                        <td>{obs.TailleCons ? `${obs.TailleCons} cm` : '—'}</td>
                        <td className="text-start" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {obs.ObservationC || '—'}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            disabled={loadingDelete}
                            onClick={() => editerObservation(obs)}
                            title="Modifier"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={loadingDelete}
                            onClick={() => handleDelete(obs)}
                            title="Supprimer"
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
            <div className="text-end mt-2">
              <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
