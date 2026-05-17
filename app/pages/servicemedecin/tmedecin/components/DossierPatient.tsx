'use client';
import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Badge, Button, Modal, Nav, Tab, Alert } from 'react-bootstrap';
import { FaUserInjured, FaHistory, FaNotesMedical, FaHospital, FaMicroscope, FaPills, FaFileAlt } from 'react-icons/fa';

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
  StatutPaiement?: string;
  montantapayer?: number;
}

interface Prescription {
  _id: string;
  Designation: string;
  DatePres: Date;
  Montanttotal?: number;
  StatutPaiement?: string;
  Modepaiement?: string;
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
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [avisHospit, setAvisHospit] = useState<AvisHospit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('consultations');

  // Charger les données du patient
  useEffect(() => {
    const chargerDossierPatient = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Charger les informations du patient
        const patientResponse = await fetch(`/api/patient?id=${patientId}`);
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatient(patientData.data || patientData);
        }

        // Charger les consultations du patient
        const consultationsResponse = await fetch(`/api/consultation?patientId=${patientId}`);
        if (consultationsResponse.ok) {
          const consultationsData = await consultationsResponse.json();
          setConsultations(consultationsData.data || consultationsData);
        }

        // Charger les prescriptions du patient
        const prescriptionsResponse = await fetch(`/api/patientprescription?patientId=${patientId}`);
        if (prescriptionsResponse.ok) {
          const prescriptionsData = await prescriptionsResponse.json();
          setPrescriptions(prescriptionsData.data || prescriptionsData);
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
                Examens
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
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">Historique des Consultations</h6>
                </Card.Header>
                <Card.Body>
                  {consultations.length > 0 ? (
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Code Prestation</th>
                          <th>Motif</th>
                          <th>Médecin</th>
                          <th>Diagnostic</th>
                          <th>Statut</th>
                          <th>Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultations.map((consultation) => (
                          <tr key={consultation._id}>
                            <td>{new Date(consultation.Date_consulation).toLocaleDateString('fr-FR')}</td>
                            <td className="text-primary fw-bold">{consultation.CodePrestation}</td>
                            <td>{consultation.MotifConsultation?.substring(0, 50) || 'N/A'}...</td>
                            <td>{consultation.Medecin || 'N/A'}</td>
                            <td>{consultation.Diagnostic?.substring(0, 30) || 'N/A'}...</td>
                            <td>
                              <Badge bg={consultation.StatutPaiement === 'Payé' ? 'success' : 'warning'}>
                                {consultation.StatutPaiement || 'N/A'}
                              </Badge>
                            </td>
                            <td className="text-end">{consultation.montantapayer || 0} FCFA</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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
                  <h6 className="mb-0">Antécédents Médicaux</h6>
                </Card.Header>
                <Card.Body>
                  {patient && (
                    <Row>
                      {patient.AntecedentMedico && (
                        <Col md={6} className="mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-danger mb-2">
                              <FaNotesMedical className="me-1" />
                              Antécédents Médicaux
                            </h6>
                            <p className="mb-0">{patient.AntecedentMedico}</p>
                          </div>
                        </Col>
                      )}
                      {patient.AnteChirurgico && (
                        <Col md={6} className="mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-danger mb-2">
                              <FaNotesMedical className="me-1" />
                              Antécédents Chirurgicaux
                            </h6>
                            <p className="mb-0">{patient.AnteChirurgico}</p>
                          </div>
                        </Col>
                      )}
                      {patient.AnteFamille && (
                        <Col md={6} className="mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-info mb-2">
                              <FaNotesMedical className="me-1" />
                              Antécédents Familiaux
                            </h6>
                            <p className="mb-0">{patient.AnteFamille}</p>
                          </div>
                        </Col>
                      )}
                      {patient.AlergiePatient && (
                        <Col md={6} className="mb-3">
                          <div className="p-3 bg-warning bg-opacity-10 rounded border border-warning">
                            <h6 className="text-warning mb-2">
                              <FaNotesMedical className="me-1" />
                              Allergies
                            </h6>
                            <p className="mb-0">{patient.AlergiePatient}</p>
                          </div>
                        </Col>
                      )}
                      {patient.AutreAnte && (
                        <Col md={12} className="mb-3">
                          <div className="p-3 bg-light rounded">
                            <h6 className="text-secondary mb-2">
                              <FaNotesMedical className="me-1" />
                              Autres Antécédents
                            </h6>
                            <p className="mb-0">{patient.AutreAnte}</p>
                          </div>
                        </Col>
                      )}
                      {!patient.AntecedentMedico && !patient.AnteChirurgico && !patient.AnteFamille && !patient.AlergiePatient && !patient.AutreAnte && (
                        <Col md={12}>
                          <div className="text-center py-4">
                            <FaNotesMedical className="text-muted fs-1 mb-3" />
                            <p className="text-muted">Aucun antécédent enregistré</p>
                          </div>
                        </Col>
                      )}
                    </Row>
                  )}
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

            {/* Examens */}
            <Tab.Pane eventKey="examens">
              <Card>
                <Card.Header className="bg-info text-white">
                  <h6 className="mb-0">Examens Paracliniques</h6>
                </Card.Header>
                <Card.Body>
                  {consultations.filter(c => c.ExamenClinique).length > 0 ? (
                    <div>
                      {consultations.filter(c => c.ExamenClinique).map((consultation, index) => (
                        <div key={consultation._id} className="mb-4 p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="text-info mb-0">Consultation du {new Date(consultation.Date_consulation).toLocaleDateString('fr-FR')}</h6>
                            <Badge bg="info">{consultation.CodePrestation}</Badge>
                          </div>
                          <div className="p-3 bg-light rounded">
                            <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                              {consultation.ExamenClinique}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaMicroscope className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun examen enregistré</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Prescriptions */}
            <Tab.Pane eventKey="prescriptions">
              <Card>
                <Card.Header className="bg-success text-white">
                  <h6 className="mb-0">Historique des Prescriptions</h6>
                </Card.Header>
                <Card.Body>
                  {prescriptions.length > 0 ? (
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Désignation</th>
                          <th>Montant</th>
                          <th>Statut</th>
                          <th>Mode Paiement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((prescription) => (
                          <tr key={prescription._id}>
                            <td>{new Date(prescription.DatePres).toLocaleDateString('fr-FR')}</td>
                            <td className="fw-bold">{prescription.Designation}</td>
                            <td className="text-end">{prescription.Montanttotal || 0} FCFA</td>
                            <td>
                              <Badge bg={prescription.StatutPaiement === 'Payé' ? 'success' : 'warning'}>
                                {prescription.StatutPaiement || 'En attente'}
                              </Badge>
                            </td>
                            <td>{prescription.Modepaiement || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
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
  );
}
