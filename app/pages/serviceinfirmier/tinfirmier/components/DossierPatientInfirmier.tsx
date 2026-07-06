'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal, Nav, Tab, Card, Row, Col, Badge,
  Table, Spinner, Alert,
} from 'react-bootstrap';
import {
  FaUserInjured, FaNotesMedical, FaHeartbeat, FaPills,
} from 'react-icons/fa';

interface DossierPatientInfirmierProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  codeDossier?: string;
}

interface Patient {
  _id: string;
  Nom: string;
  Prenoms: string;
  sexe: string;
  Age_partient?: number;
  Date_naisse?: string;
  Contact?: string;
  Code_dossier: string;
  Assurance?: string;
  Matricule?: string;
  AntecedentMedico?: string;
  AnteChirurgico?: string;
  AnteFamille?: string;
  AlergiePatient?: string;
}

interface Consultation {
  _id: string;
  Date_consulation: string;
  MotifConsultation?: string;
  Diagnostic?: string;
  Medecin?: string;
  Temperature?: string;
  Poids?: string;
  Tension?: string;
  Glycemie?: string;
  TraitementClinique?: string;
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
  createdAt?: string;
}

interface Prescription {
  _id: string;
  designation?: string;
  NomMedicament?: string;
  Posologie?: string;
  Date_consulation?: string;
  createdAt?: string;
}

export default function DossierPatientInfirmier({
  show, onHide, patientId, patientNom, patientPrenoms, codeDossier,
}: DossierPatientInfirmierProps) {
  const [patient, setPatient]               = useState<Patient | null>(null);
  const [consultations, setConsultations]   = useState<Consultation[]>([]);
  const [observations, setObservations]     = useState<Observation[]>([]);
  const [prescriptions, setPrescriptions]   = useState<Prescription[]>([]);
  const [loading, setLoading]               = useState(false);
  const [activeKey, setActiveKey]           = useState('infos');

  useEffect(() => {
    if (show && patientId) {
      chargerDonnees();
    }
  }, [show, patientId]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const [patRes, consRes, obsRes, prescRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/consultations?patientId=${patientId}`),
        fetch(`/api/observations?patientId=${patientId}`),
        fetch(`/api/prescriptions?patientId=${patientId}`),
      ]);

      if (patRes.ok)    setPatient(await patRes.json());
      if (consRes.ok)   setConsultations(await consRes.json());
      if (obsRes.ok)    setObservations(await obsRes.json());
      if (prescRes.ok)  setPrescriptions(await prescRes.json());
    } catch (error) {
      console.error('Erreur chargement dossier patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton className="bg-secondary text-white">
        <Modal.Title>
          <FaUserInjured className="me-2" />
          Dossier Patient — {patientNom} {patientPrenoms}
          {codeDossier && <Badge bg="light" text="dark" className="ms-3">{codeDossier}</Badge>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" /></div>
        ) : (
          <Tab.Container activeKey={activeKey} onSelect={(k) => setActiveKey(k || 'infos')}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="infos">
                  <FaUserInjured className="me-1" /> Infos Patient
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="consultations">
                  <FaNotesMedical className="me-1" /> Consultations
                  {consultations.length > 0 && <Badge bg="primary" className="ms-1">{consultations.length}</Badge>}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="constantes">
                  <FaHeartbeat className="me-1" /> Constantes
                  {observations.length > 0 && <Badge bg="info" className="ms-1">{observations.length}</Badge>}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="prescriptions">
                  <FaPills className="me-1" /> Prescriptions
                  {prescriptions.length > 0 && <Badge bg="success" className="ms-1">{prescriptions.length}</Badge>}
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* ── Infos Patient ──────────────────────────────── */}
              <Tab.Pane eventKey="infos">
                {patient ? (
                  <Row>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header className="fw-bold">Identité</Card.Header>
                        <Card.Body>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Nom complet</Col><Col className="fw-bold">{patient.Nom} {patient.Prenoms}</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Sexe</Col><Col>{patient.sexe}</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Âge</Col><Col>{patient.Age_partient} ans</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Date naissance</Col><Col>{formatDate(patient.Date_naisse)}</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Contact</Col><Col>{patient.Contact || '—'}</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Code dossier</Col><Col><Badge bg="secondary">{patient.Code_dossier}</Badge></Col></Row>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header className="fw-bold">Antécédents & Allergies</Card.Header>
                        <Card.Body>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Médico</Col><Col>{patient.AntecedentMedico || '—'}</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Chirurgical</Col><Col>{patient.AnteChirurgico || '—'}</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Familial</Col><Col>{patient.AnteFamille || '—'}</Col></Row>
                          <Row className="mb-2">
                            <Col xs={5} className="text-muted">Allergies</Col>
                            <Col>
                              {patient.AlergiePatient
                                ? <Badge bg="danger">{patient.AlergiePatient}</Badge>
                                : <span className="text-muted">Aucune connue</span>}
                            </Col>
                          </Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Assurance</Col><Col>{patient.Assurance || '—'}</Col></Row>
                          <Row className="mb-2"><Col xs={5} className="text-muted">Matricule</Col><Col>{patient.Matricule || '—'}</Col></Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                ) : (
                  <Alert variant="warning">Patient introuvable.</Alert>
                )}
              </Tab.Pane>

              {/* ── Consultations ──────────────────────────────── */}
              <Tab.Pane eventKey="consultations">
                {consultations.length === 0 ? (
                  <Alert variant="info">Aucune consultation enregistrée.</Alert>
                ) : (
                  <div className="table-responsive">
                    <Table bordered hover size="sm" className="text-center">
                      <thead className="table-primary">
                        <tr>
                          <th>Date</th>
                          <th>Motif</th>
                          <th>Diagnostic</th>
                          <th>Médecin</th>
                          <th>Traitement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultations.map((c) => (
                          <tr key={c._id}>
                            <td>{formatDate(c.Date_consulation)}</td>
                            <td>{c.MotifConsultation || '—'}</td>
                            <td>{c.Diagnostic || '—'}</td>
                            <td>{c.Medecin || '—'}</td>
                            <td className="text-start">{c.TraitementClinique || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>

              {/* ── Constantes vitales ──────────────────────────── */}
              <Tab.Pane eventKey="constantes">
                {observations.length === 0 ? (
                  <Alert variant="info">Aucune constante enregistrée. Utilisez le bouton "Constantes" dans la liste pour en saisir.</Alert>
                ) : (
                  <div className="table-responsive">
                    <Table bordered hover size="sm" className="text-center">
                      <thead className="table-info">
                        <tr>
                          <th>Date</th>
                          <th>Heure</th>
                          <th>🌡️ Temp.</th>
                          <th>🩺 Tension</th>
                          <th>⚖️ Poids</th>
                          <th>🍬 Glycémie</th>
                          <th>📏 Taille</th>
                          <th>Observation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {observations.map((obs) => (
                          <tr key={obs._id}>
                            <td>{formatDate(obs.Date || obs.createdAt)}</td>
                            <td>{obs.Heure || '—'}</td>
                            <td>{obs.Temperature ? `${obs.Temperature}°C` : '—'}</td>
                            <td>{obs.Tension || '—'}</td>
                            <td>{obs.Poids ? `${obs.Poids} kg` : '—'}</td>
                            <td>{obs.Glycemie || '—'}</td>
                            <td>{obs.TailleCons ? `${obs.TailleCons} cm` : '—'}</td>
                            <td className="text-start">{obs.ObservationC || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>

              {/* ── Prescriptions ──────────────────────────────── */}
              <Tab.Pane eventKey="prescriptions">
                {prescriptions.length === 0 ? (
                  <Alert variant="info">Aucune prescription enregistrée.</Alert>
                ) : (
                  <div className="table-responsive">
                    <Table bordered hover size="sm" className="text-center">
                      <thead className="table-success">
                        <tr>
                          <th>Date</th>
                          <th>Médicament / Acte</th>
                          <th>Posologie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((p) => (
                          <tr key={p._id}>
                            <td>{formatDate(p.Date_consulation || p.createdAt)}</td>
                            <td>{p.NomMedicament || p.designation || '—'}</td>
                            <td>{p.Posologie || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        )}
      </Modal.Body>
    </Modal>
  );
}
