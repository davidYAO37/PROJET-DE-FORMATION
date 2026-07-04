'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Modal, Nav, Tab, Alert, Form, Spinner, ButtonGroup, Pagination } from 'react-bootstrap';
import { FaUserInjured, FaHistory, FaNotesMedical, FaHospital, FaMicroscope, FaPills, FaFileAlt, FaChevronDown, FaChevronRight, FaThermometerHalf, FaWeight, FaHeartbeat, FaStethoscope, FaPrint, FaSave, FaEdit, FaEye } from 'react-icons/fa';
import PrintFichePrescription from '../../MesImpressions/printFichePrescription';

interface Patient {
  _id: string;
  Nom: string;
  Prenoms: string;
  Date_naisse: Date;
  sexe: string;
  Contact?: string;
  Code_dossier: string;
  Age_partient?: number;
  Situationgeo?: string;
  Assurance?: string;
  Matricule?: string;
  AntecedentMedico?: string;
  AnteChirurgico?: string;
  AnteFamille?: string;
  AutreAnte?: string;
  AlergiePatient?: string;
}

interface Consultation {
  _id: string;
  CodePrestation: string;
  Date_consulation: Date;
  MotifConsultation?: string;
  ExamenClinique?: string;
  ConclusionClinique?: string;
  Diagnostic?: string;
  Temperature?: string;
  Poids?: string;
  Tension?: string;
  Glycemie?: string;
  Medecin?: string;
  TraitementClinique?: string;
  ExamenParaclinique?: string;
  CodeAffection?: string;
}

interface Examen {
  _id: string;
  designationTypeActe: string;
  montant: number;
  date: string;
  statut: string;
  StatutLaboratoire: number;
  codePrestation: string;
  NomMed?: string;
}

interface PrescriptionItem {
  _id: string;
  designation: string;
  montant: number;
  date: string;
  statut: boolean;
  codePrestation: string;
  NomMed?: string;
}

interface AvisHospit {
  _id: string;
  serviceHospit: string;
  etatPatient: string;
  DureHospit: string;
  DateIntervention: Date;
  HeureHospit: string;
  Diagnostic: string;
  MedecinTraitant: string;
  DatePrevue: Date;
  Isolement?: boolean;
  HospitAnt?: boolean;
  sejourunjour?: boolean;
}

interface DossierPatientProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
}

export default function DossierPatient({ 
  show, 
  onHide, 
  patientId, 
  patientNom, 
  patientPrenoms 
}: DossierPatientProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [examens, setExamens] = useState<Examen[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [avisHospit, setAvisHospit] = useState<AvisHospit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('consultations');
  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(null);
  const [expandedExamen, setExpandedExamen] = useState<string | null>(null);
  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null);
  const [printConsultation, setPrintConsultation] = useState<Consultation | null>(null);

  // Antécédents - saisie
  const [antForm, setAntForm] = useState({
    AntecedentMedico: '',
    AnteChirurgico: '',
    AnteFamille: '',
    AutreAnte: '',
    AlergiePatient: ''
  });
  const [savingAntecedents, setSavingAntecedents] = useState(false);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [examenPage, setExamenPage] = useState(1);
  const [prescriptionPage, setPrescriptionPage] = useState(1);

  // Détail prescription (lignes médicaments)
  const [prescriptionDetails, setPrescriptionDetails] = useState<Record<string, any[]>>({});

  const toggleConsultation = (id: string) =>
    setExpandedConsultation(prev => (prev === id ? null : id));

  const toggleExamen = (id: string) =>
    setExpandedExamen(prev => (prev === id ? null : id));

  const togglePrescription = async (id: string, codePrestation: string) => {
    if (expandedPrescription === id) {
      setExpandedPrescription(null);
      return;
    }
    setExpandedPrescription(id);
    // Charger les détails si pas encore chargés
    if (!prescriptionDetails[id]) {
      try {
        const res = await fetch(`/api/patientprescription?CodePrestation=${encodeURIComponent(codePrestation)}`);
        if (res.ok) {
          const data = await res.json();
          setPrescriptionDetails(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
        }
      } catch (e) {
        console.error('Erreur chargement détail prescription:', e);
      }
    }
  };

  // Charger les données du patient
  useEffect(() => {
    const chargerDossierPatient = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Charger les informations du patient
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          const p = patientData.data || patientData;
          setPatient(p);
          setAntForm({
            AntecedentMedico: p.AntecedentMedico || '',
            AnteChirurgico: p.AnteChirurgico || '',
            AnteFamille: p.AnteFamille || '',
            AutreAnte: p.AutreAnte || '',
            AlergiePatient: p.AlergiePatient || ''
          });
        }

        // Charger les consultations du patient
        const consultationsResponse = await fetch(`/api/consultation?patientId=${patientId}`);
        if (consultationsResponse.ok) {
          const consultationsData = await consultationsResponse.json();
          setConsultations(consultationsData.data || consultationsData);
        }

        // Charger les examens/prestations du patient
        const examensResponse = await fetch(`/api/ListeAutreActes?patientId=${patientId}`);
        if (examensResponse.ok) {
          const examensData = await examensResponse.json();
          setExamens(Array.isArray(examensData) ? examensData : []);
        }

        // Charger les prescriptions du patient
        const prescriptionsResponse = await fetch(`/api/ListePrescription?patientId=${patientId}`);
        if (prescriptionsResponse.ok) {
          const prescriptionsData = await prescriptionsResponse.json();
          setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
        }

        // Charger les avis d'hospitalisation du patient
        const avisResponse = await fetch(`/api/avishospit?patientId=${patientId}`);
        if (avisResponse.ok) {
          const avisData = await avisResponse.json();
          setAvisHospit(avisData.data || []);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (show && patientId) {
      chargerDossierPatient();
    }
  }, [show, patientId]);

  // Sauvegarder les antécédents
  const handleSaveAntecedents = async () => {
    setSavingAntecedents(true);
    try {
      const res = await fetch('/api/fichePrescriptionMedecin/antecedents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          antecedents: antForm
        })
      });
      if (res.ok) {
        setPatient(prev => prev ? { ...prev, ...antForm } : prev);
      }
    } catch (e) {
      console.error('Erreur sauvegarde antécédents:', e);
    } finally {
      setSavingAntecedents(false);
    }
  };

  // Fonction pour calculer l'âge
  const calculateAge = (dateOfBirth: Date, ageProvided?: number) => {
    if (ageProvided) return ageProvided;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Fonction pour obtenir le libellé du service
  const getServiceLibelle = (service: string) => {
    const services: { [key: string]: string } = {
      'MED': 'Médecine',
      'CHIR': 'Chirurgie',
      'CHR.SP': 'Chirurgie Spécialisée',
      'OBST': 'Obstétrique',
      'GYN': 'Gynécologie',
      'PED': 'Pédiatrie'
    };
    return services[service] || service;
  };

  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Dossier Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-3">Chargement du dossier patient...</p>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Dossier Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Erreur: {error}
          </Alert>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <>
    <Modal show={show} onHide={onHide} size="xl" className="dossier-patient-modal">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaUserInjured className="me-2" />
          Dossier Patient Complet
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Informations Patient */}
        {patient && (
          <Card className="mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Informations Patient</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Table striped hover size="sm">
                    <tbody>
                      <tr>
                        <td className="fw-bold">Nom:</td>
                        <td>{patient.Nom}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Prénoms:</td>
                        <td>{patient.Prenoms}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Âge:</td>
                        <td>{patient.Age_partient || calculateAge(patient.Date_naisse)} ans</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Sexe:</td>
                        <td>{patient.sexe}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table striped hover size="sm">
                    <tbody>
                      <tr>
                        <td className="fw-bold">Code dossier:</td>
                        <td className="text-primary fw-bold">{patient.Code_dossier}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Contact:</td>
                        <td>{patient.Contact || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Assurance:</td>
                        <td>{patient.Assurance || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Matricule:</td>
                        <td>{patient.Matricule || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Onglets pour les différentes sections */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'consultations')}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="consultations">
                <FaHistory className="me-1" />
                Historique Consultations ({consultations.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="antecedents">
                <FaNotesMedical className="me-1" />
                Antécédents
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="hospitalisations">
                <FaHospital className="me-1" />
                Hospitalisations ({avisHospit.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="examens">
                <FaMicroscope className="me-1" />
                Examens ({examens.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="prescriptions">
                <FaPills className="me-1" />
                Prescriptions ({prescriptions.length})
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Historique des Consultations */}
            <Tab.Pane eventKey="consultations">
              <Card>
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaHistory className="me-2" />Historique des Consultations</h6>
                  <Badge bg="light" text="dark">{consultations.length} consultation(s)</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {consultations.length > 0 ? (
                    <div>
                      {/* En-tête résumé */}
                      <Table size="sm" className="mb-0" hover>
                        <thead className="table-light">
                          <tr>
                            <th style={{width: 50}} className="text-center">Action</th>
                            <th style={{width: 30}}></th>
                            <th>Date</th>
                            <th>Code Prestation</th>
                            <th>Motif</th>
                            <th>Médecin</th>
                            <th className="text-center">Constantes</th>
                            <th>Diagnostic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...consultations]
                            .sort((a, b) => new Date(b.Date_consulation).getTime() - new Date(a.Date_consulation).getTime())
                            .map((consultation) => {
                              const isOpen = expandedConsultation === consultation._id;
                              const hasConstantes = consultation.Poids || consultation.Temperature || consultation.Tension || consultation.Glycemie;
                              return (
                                <React.Fragment key={consultation._id}>
                                  <tr
                                    style={{ cursor: 'pointer' }}
                                    className={isOpen ? 'table-primary' : ''}
                                  >
                                    <td className="text-center" onClick={e => e.stopPropagation()}>
                                      <Button
                                        size="sm"
                                        variant="outline-primary"
                                        title="Imprimer la fiche de prescription"
                                        style={{ padding: '2px 6px' }}
                                        onClick={() => setPrintConsultation(consultation)}
                                      >
                                        <FaPrint size={11} />
                                      </Button>
                                    </td>
                                    <td className="text-center text-muted" onClick={() => toggleConsultation(consultation._id)}>
                                      {isOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                    </td>
                                    <td className="small fw-semibold text-nowrap" onClick={() => toggleConsultation(consultation._id)}>
                                      {new Date(consultation.Date_consulation).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td onClick={() => toggleConsultation(consultation._id)}><span className="badge bg-primary small">{consultation.CodePrestation}</span></td>
                                    <td className="small" onClick={() => toggleConsultation(consultation._id)}>{consultation.MotifConsultation
                                      ? consultation.MotifConsultation.length > 40
                                        ? consultation.MotifConsultation.substring(0, 40) + '…'
                                        : consultation.MotifConsultation
                                      : <span className="text-muted">—</span>}
                                    </td>
                                    <td className="small text-muted" onClick={() => toggleConsultation(consultation._id)}>{consultation.Medecin || '—'}</td>
                                    <td className="text-center" onClick={() => toggleConsultation(consultation._id)}>
                                      {hasConstantes ? (
                                        <span className="text-success small">
                                          {consultation.Temperature && <span className="me-2" title="Temp."><FaThermometerHalf className="me-1" />{consultation.Temperature}°</span>}
                                          {consultation.Poids && <span className="me-2" title="Poids"><FaWeight className="me-1" />{consultation.Poids}kg</span>}
                                          {consultation.Tension && <span title="Tension"><FaHeartbeat className="me-1" />{consultation.Tension}</span>}
                                        </span>
                                      ) : <span className="text-muted small">—</span>}
                                    </td>
                                    <td className="small" onClick={() => toggleConsultation(consultation._id)}>{consultation.Diagnostic
                                      ? consultation.Diagnostic.length > 35
                                        ? consultation.Diagnostic.substring(0, 35) + '…'
                                        : consultation.Diagnostic
                                      : <span className="text-muted">—</span>}
                                    </td>
                                  </tr>
                                  {/* Ligne de détail accordéon */}
                                  {isOpen && (
                                    <tr key={consultation._id + '_detail'}>
                                      <td colSpan={8} className="p-0 bg-light border-top-0">
                                        <div className="p-3">
                                          <Row className="g-3">
                                            {consultation.ExamenClinique && (
                                              <Col md={6}>
                                                <div className="p-2 bg-white rounded border">
                                                  <div className="small fw-bold text-primary mb-1"><FaMicroscope className="me-1" />Examen Clinique</div>
                                                  <div className="small" style={{ whiteSpace: 'pre-line' }}>{consultation.ExamenClinique}</div>
                                                </div>
                                              </Col>
                                            )}
                                            {consultation.ExamenParaclinique && (
                                              <Col md={6}>
                                                <div className="p-2 bg-white rounded border">
                                                  <div className="small fw-bold text-info mb-1"><FaMicroscope className="me-1" />Examens Paracliniques</div>
                                                  <div className="small" style={{ whiteSpace: 'pre-line' }}>{consultation.ExamenParaclinique}</div>
                                                </div>
                                              </Col>
                                            )}
                                            {consultation.CodeAffection && (
                                              <Col md={6}>
                                                <div className="p-2 bg-white rounded border">
                                                  <div className="small fw-bold text-warning mb-1"><FaStethoscope className="me-1" />Code Affection</div>
                                                  <div className="small" style={{ whiteSpace: 'pre-line' }}>{consultation.CodeAffection}</div>
                                                </div>
                                              </Col>
                                            )}
                                            {consultation.TraitementClinique && (
                                              <Col md={6}>
                                                <div className="p-2 bg-white rounded border">
                                                  <div className="small fw-bold text-success mb-1"><FaPills className="me-1" />Traitement</div>
                                                  <div className="small" style={{ whiteSpace: 'pre-line' }}>{consultation.TraitementClinique}</div>
                                                </div>
                                              </Col>
                                            )}
                                            {consultation.ConclusionClinique && (
                                              <Col md={6}>
                                                <div className="p-2 bg-white rounded border">
                                                  <div className="small fw-bold text-secondary mb-1"><FaFileAlt className="me-1" />Conclusion</div>
                                                  <div className="small" style={{ whiteSpace: 'pre-line' }}>{consultation.ConclusionClinique}</div>
                                                </div>
                                              </Col>
                                            )}
                                            {/* Constantes complètes */}
                                            {hasConstantes && (
                                              <Col md={12}>
                                                <div className="p-2 bg-white rounded border">
                                                  <div className="small fw-bold text-warning mb-2"><FaThermometerHalf className="me-1" />Constantes</div>
                                                  <Row className="g-2">
                                                    {consultation.Temperature && <Col xs="auto"><Badge bg="danger" className="small">Temp : {consultation.Temperature} °C</Badge></Col>}
                                                    {consultation.Poids && <Col xs="auto"><Badge bg="secondary" className="small">Poids : {consultation.Poids} kg</Badge></Col>}
                                                    {consultation.Tension && <Col xs="auto"><Badge bg="primary" className="small">TA : {consultation.Tension}</Badge></Col>}
                                                    {consultation.Glycemie && <Col xs="auto"><Badge bg="warning" text="dark" className="small">Glycémie : {consultation.Glycemie}</Badge></Col>}
                                                  </Row>
                                                </div>
                                              </Col>
                                            )}
                                          </Row>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaHistory className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucune consultation trouvée</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Antécédents */}
            <Tab.Pane eventKey="antecedents">
              <Card>
                <Card.Header className="bg-warning text-dark">
                  <h6 className="mb-0"><FaNotesMedical className="me-2" />Antécédents du Patient</h6>
                </Card.Header>
                <Card.Body>
                  {/* Affichage des antécédents existants */}
                  {patient && (
                    <Row className="mb-4">
                      <Col md={6} className="mb-3">
                        <div className="p-3 bg-light rounded border">
                          <h6 className="text-danger mb-2"><FaNotesMedical className="me-1" />Antécédents Médicaux</h6>
                          <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{patient.AntecedentMedico || <span className="text-muted fst-italic">Aucun</span>}</p>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="p-3 bg-light rounded border">
                          <h6 className="text-danger mb-2"><FaNotesMedical className="me-1" />Antécédents Chirurgicaux</h6>
                          <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{patient.AnteChirurgico || <span className="text-muted fst-italic">Aucun</span>}</p>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="p-3 bg-light rounded border">
                          <h6 className="text-info mb-2"><FaNotesMedical className="me-1" />Antécédents Familiaux</h6>
                          <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{patient.AnteFamille || <span className="text-muted fst-italic">Aucun</span>}</p>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="p-3 bg-warning bg-opacity-10 rounded border border-warning">
                          <h6 className="text-warning mb-2"><FaNotesMedical className="me-1" />Allergies</h6>
                          <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{patient.AlergiePatient || <span className="text-muted fst-italic">Aucune</span>}</p>
                        </div>
                      </Col>
                      <Col md={12} className="mb-3">
                        <div className="p-3 bg-light rounded border">
                          <h6 className="text-secondary mb-2"><FaNotesMedical className="me-1" />Autres Antécédents</h6>
                          <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{patient.AutreAnte || <span className="text-muted fst-italic">Aucun</span>}</p>
                        </div>
                      </Col>
                    </Row>
                  )}

                  {/* Formulaire d'ajout / modification */}
                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 text-primary"><FaEdit className="me-1" />Saisir / Modifier les antécédents</h6>
                    <Button size="sm" variant="success" onClick={handleSaveAntecedents} disabled={savingAntecedents}>
                      {savingAntecedents ? <Spinner size="sm" animation="border" /> : <FaSave className="me-1" />}
                      Enregistrer
                    </Button>
                  </div>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold small text-danger"><FaNotesMedical className="me-1" />Antécédents Médicaux</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Saisir les antécédents médicaux..." value={antForm.AntecedentMedico} onChange={e => setAntForm(f => ({ ...f, AntecedentMedico: e.target.value }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold small text-danger"><FaNotesMedical className="me-1" />Antécédents Chirurgicaux</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Saisir les antécédents chirurgicaux..." value={antForm.AnteChirurgico} onChange={e => setAntForm(f => ({ ...f, AnteChirurgico: e.target.value }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold small text-info"><FaNotesMedical className="me-1" />Antécédents Familiaux</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Saisir les antécédents familiaux..." value={antForm.AnteFamille} onChange={e => setAntForm(f => ({ ...f, AnteFamille: e.target.value }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold small text-warning"><FaNotesMedical className="me-1" />Allergies</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Saisir les allergies..." value={antForm.AlergiePatient} onChange={e => setAntForm(f => ({ ...f, AlergiePatient: e.target.value }))} />
                      </Form.Group>
                    </Col>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold small text-secondary"><FaNotesMedical className="me-1" />Autres Antécédents</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Saisir d'autres antécédents..." value={antForm.AutreAnte} onChange={e => setAntForm(f => ({ ...f, AutreAnte: e.target.value }))} />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Hospitalisations */}
            <Tab.Pane eventKey="hospitalisations">
              <Card>
                <Card.Header className="bg-danger text-white">
                  <h6 className="mb-0">Historique des Hospitalisations</h6>
                </Card.Header>
                <Card.Body>
                  {avisHospit.length > 0 ? (
                    <div>
                      {avisHospit.map((avis, index) => (
                        <div key={avis._id} className="mb-4 p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="text-danger mb-0">Avis #{index + 1}</h6>
                            <Badge bg="danger">{getServiceLibelle(avis.serviceHospit)}</Badge>
                          </div>
                          <Row>
                            <Col md={6}>
                              <Table striped hover size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">Date Intervention:</td>
                                    <td>{new Date(avis.DateIntervention).toLocaleDateString('fr-FR')}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Heure:</td>
                                    <td>{avis.HeureHospit}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Durée:</td>
                                    <td>{avis.DureHospit}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">État Patient:</td>
                                    <td>{avis.etatPatient}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </Col>
                            <Col md={6}>
                              <Table striped hover size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">Médecin Traitant:</td>
                                    <td>{avis.MedecinTraitant}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Diagnostic:</td>
                                    <td>{avis.Diagnostic}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Date Prévue:</td>
                                    <td>{new Date(avis.DatePrevue).toLocaleDateString('fr-FR')}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Options:</td>
                                    <td>
                                      {avis.Isolement && <Badge bg="warning" className="me-1">Isolement</Badge>}
                                      {avis.HospitAnt && <Badge bg="info" className="me-1">Hospit. Ant.</Badge>}
                                      {avis.sejourunjour && <Badge bg="secondary">Séjour Jour</Badge>}
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaHospital className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucune hospitalisation trouvée</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Examens / Prestations */}
            <Tab.Pane eventKey="examens">
              <Card>
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaMicroscope className="me-2" />Examens & Prestations</h6>
                  <Badge bg="light" text="dark">{examens.length} acte(s)</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {examens.length > 0 ? (() => {
                    const totalPages = Math.ceil(examens.length / ITEMS_PER_PAGE);
                    const paginated = examens.slice((examenPage - 1) * ITEMS_PER_PAGE, examenPage * ITEMS_PER_PAGE);
                    return (
                      <>
                        <Table size="sm" className="mb-0" hover responsive>
                          <thead className="table-light">
                            <tr>
                              <th style={{width: 30}}></th>
                              <th>Date</th>
                              <th>Code Prestation</th>
                              <th>Désignation</th>
                              <th>Médecin Prescripteur</th>
                              <th className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginated.map((examen) => {
                              const isOpen = expandedExamen === examen._id;
                              const isBiologie = examen.designationTypeActe?.toUpperCase().includes('BIOLOG');
                              const isRadio = examen.designationTypeActe?.toUpperCase().includes('RADIO') || examen.designationTypeActe?.toUpperCase().includes('IMAGERIE');
                              return (
                                <React.Fragment key={examen._id}>
                                  <tr style={{ cursor: 'pointer' }} className={isOpen ? 'table-info' : ''}>
                                    <td className="text-center" onClick={() => toggleExamen(examen._id)}>
                                      {isOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                    </td>
                                    <td className="small text-nowrap" onClick={() => toggleExamen(examen._id)}>
                                      {new Date(examen.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td onClick={() => toggleExamen(examen._id)}><Badge bg="info">{examen.codePrestation}</Badge></td>
                                    <td className="small" onClick={() => toggleExamen(examen._id)}>{examen.designationTypeActe}</td>
                                    <td className="small" onClick={() => toggleExamen(examen._id)}>{examen.NomMed || '—'}</td>
                                    <td className="text-center" onClick={e => e.stopPropagation()}>
                                      {(isBiologie || isRadio) && examen.StatutLaboratoire >= 3 ? (
                                        <ButtonGroup size="sm">
                                          <Button variant="outline-primary" title="Imprimer avec entête" onClick={() => window.open(`/api/laboratoire/resultat/${examen._id}/pdf?avecEntete=true`, '_blank')}>
                                            <FaPrint /> <small>Entête</small>
                                          </Button>
                                          <Button variant="outline-secondary" title="Imprimer sans entête" onClick={() => window.open(`/api/laboratoire/resultat/${examen._id}/pdf?avecEntete=false`, '_blank')}>
                                            <FaPrint /> <small>Sans</small>
                                          </Button>
                                        </ButtonGroup>
                                      ) : (
                                        <span className="text-muted small">—</span>
                                      )}
                                    </td>
                                  </tr>
                                  {isOpen && (
                                    <tr>
                                      <td colSpan={6} className="p-0 bg-light border-top-0">
                                        <div className="p-3">
                                          <Row className="g-2">
                                            <Col xs="auto"><Badge bg="secondary">Montant: {examen.montant?.toLocaleString()} FCFA</Badge></Col>
                                            <Col xs="auto">
                                              <Badge bg={examen.statut === 'Validé' ? 'success' : 'warning'}>
                                                Paiement: {examen.statut}
                                              </Badge>
                                            </Col>
                                            <Col xs="auto">
                                              <Badge bg={
                                                examen.StatutLaboratoire === 5 ? 'info' :
                                                examen.StatutLaboratoire === 4 ? 'success' :
                                                examen.StatutLaboratoire === 3 ? 'primary' :
                                                examen.StatutLaboratoire >= 1 ? 'warning' : 'secondary'
                                              }>
                                                Labo: {examen.StatutLaboratoire === 5 ? 'Retourné' :
                                                       examen.StatutLaboratoire === 4 ? 'Validé' :
                                                       examen.StatutLaboratoire === 3 ? 'En Saisie' :
                                                       examen.StatutLaboratoire === 2 ? 'Réceptionné' :
                                                       examen.StatutLaboratoire === 1 ? 'En cours' : 'En attente'}
                                              </Badge>
                                            </Col>
                                          </Row>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </Table>
                        {totalPages > 1 && (
                          <div className="d-flex justify-content-center py-2">
                            <Pagination size="sm" className="mb-0">
                              <Pagination.First onClick={() => setExamenPage(1)} disabled={examenPage === 1} />
                              <Pagination.Prev onClick={() => setExamenPage(p => Math.max(1, p - 1))} disabled={examenPage === 1} />
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - examenPage) <= 2)
                                .map((p, idx, arr) => (
                                  <React.Fragment key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && <Pagination.Ellipsis disabled />}
                                    <Pagination.Item active={p === examenPage} onClick={() => setExamenPage(p)}>{p}</Pagination.Item>
                                  </React.Fragment>
                                ))}
                              <Pagination.Next onClick={() => setExamenPage(p => Math.min(totalPages, p + 1))} disabled={examenPage === totalPages} />
                              <Pagination.Last onClick={() => setExamenPage(totalPages)} disabled={examenPage === totalPages} />
                            </Pagination>
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="text-center py-4">
                      <FaMicroscope className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun examen ou prestation enregistré</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Prescriptions */}
            <Tab.Pane eventKey="prescriptions">
              <Card>
                <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaPills className="me-2" />Ordonnances / Prescriptions</h6>
                  <Badge bg="light" text="dark">{prescriptions.length} ordonnance(s)</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {prescriptions.length > 0 ? (() => {
                    const totalPages = Math.ceil(prescriptions.length / ITEMS_PER_PAGE);
                    const paginated = prescriptions.slice((prescriptionPage - 1) * ITEMS_PER_PAGE, prescriptionPage * ITEMS_PER_PAGE);
                    return (
                      <>
                        <Table size="sm" className="mb-0" hover responsive>
                          <thead className="table-light">
                            <tr>
                              <th style={{width: 30}}></th>
                              <th>Date</th>
                              <th>Code Prestation</th>
                              <th>Désignation</th>
                              <th>Médecin Prescripteur</th>
                              <th className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginated.map((presc) => {
                              const isOpen = expandedPrescription === presc._id;
                              const details = prescriptionDetails[presc._id];
                              return (
                                <React.Fragment key={presc._id}>
                                  <tr style={{ cursor: 'pointer' }} className={isOpen ? 'table-success' : ''}>
                                    <td className="text-center" onClick={() => togglePrescription(presc._id, presc.codePrestation)}>
                                      {isOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                    </td>
                                    <td className="small text-nowrap" onClick={() => togglePrescription(presc._id, presc.codePrestation)}>
                                      {new Date(presc.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td onClick={() => togglePrescription(presc._id, presc.codePrestation)}><Badge bg="success">{presc.codePrestation}</Badge></td>
                                    <td className="small" onClick={() => togglePrescription(presc._id, presc.codePrestation)}>{presc.designation}</td>
                                    <td className="small" onClick={() => togglePrescription(presc._id, presc.codePrestation)}>{presc.NomMed || '—'}</td>
                                    <td className="text-center" onClick={e => e.stopPropagation()}>
                                      <Button size="sm" variant="outline-success" title="Imprimer l'ordonnance" onClick={() => setPrintConsultation({ _id: presc._id, CodePrestation: presc.codePrestation, Date_consulation: new Date(presc.date) } as any)}>
                                        <FaPrint className="me-1" /> Ordonnance
                                      </Button>
                                    </td>
                                  </tr>
                                  {isOpen && (
                                    <tr>
                                      <td colSpan={6} className="p-0 bg-light border-top-0">
                                        <div className="p-3">
                                          {!details ? (
                                            <div className="text-center"><Spinner size="sm" animation="border" /> Chargement...</div>
                                          ) : details.length === 0 ? (
                                            <p className="text-muted mb-0 small">Aucune ligne de prescription</p>
                                          ) : (
                                            <Table size="sm" bordered className="mb-0 bg-white">
                                              <thead>
                                                <tr className="table-success">
                                                  <th>Médicament</th>
                                                  <th>Posologie</th>
                                                  <th className="text-center">Qté</th>
                                                  <th className="text-end">P.U</th>
                                                  <th className="text-end">Total</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {details.map((d: any) => (
                                                  <tr key={d._id}>
                                                    <td className="small">{d.nomMedicament}</td>
                                                    <td className="small">{d.posologie || '—'}</td>
                                                    <td className="text-center small">{d.QteP}</td>
                                                    <td className="text-end small">{(d.prixUnitaire || 0).toLocaleString()}</td>
                                                    <td className="text-end small fw-bold">{(d.prixTotal || 0).toLocaleString()} FCFA</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </Table>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </Table>
                        {totalPages > 1 && (
                          <div className="d-flex justify-content-center py-2">
                            <Pagination size="sm" className="mb-0">
                              <Pagination.First onClick={() => setPrescriptionPage(1)} disabled={prescriptionPage === 1} />
                              <Pagination.Prev onClick={() => setPrescriptionPage(p => Math.max(1, p - 1))} disabled={prescriptionPage === 1} />
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - prescriptionPage) <= 2)
                                .map((p, idx, arr) => (
                                  <React.Fragment key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && <Pagination.Ellipsis disabled />}
                                    <Pagination.Item active={p === prescriptionPage} onClick={() => setPrescriptionPage(p)}>{p}</Pagination.Item>
                                  </React.Fragment>
                                ))}
                              <Pagination.Next onClick={() => setPrescriptionPage(p => Math.min(totalPages, p + 1))} disabled={prescriptionPage === totalPages} />
                              <Pagination.Last onClick={() => setPrescriptionPage(totalPages)} disabled={prescriptionPage === totalPages} />
                            </Pagination>
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="text-center py-4">
                      <FaPills className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucune prescription trouvée</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
        <Button variant="primary" onClick={() => window.print()}>
          <FaFileAlt className="me-1" />
          Imprimer le Dossier
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Modal Impression Fiche de Prescription */}

    {printConsultation && (
      <Modal show={!!printConsultation} onHide={() => setPrintConsultation(null)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPrint className="me-2" />
            Impression de la Fiche de Prescription
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <PrintFichePrescription
            consultationId={printConsultation!.CodePrestation}
            patientId={patient?._id}
            patientNom={patient?.Nom}
            patientPrenoms={patient?.Prenoms}
          />
        </Modal.Body>
      </Modal>
    )}
  </>);
}
