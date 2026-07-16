'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Row, Col, Table, Badge, Button, Modal, Nav, Tab, Alert, Form, Spinner } from 'react-bootstrap';
import { FaUserInjured, FaHistory, FaNotesMedical, FaHospital, FaMicroscope, FaPills, FaFileAlt, FaThermometerHalf, FaWeight, FaHeartbeat, FaStethoscope, FaChevronDown, FaChevronRight, FaFileMedical, FaBriefcaseMedical, FaEdit, FaSave, FaList } from 'react-icons/fa';

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
  ExamenParaclinique?: string;
  TraitementClinique?: string;
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
  designation: string;
  montant: number;
  date: string | Date;
  statut: boolean;
  patientId?: string;
  codePrestation: string;
  designationTypeActe?: string;
  Numfacture?: string;
  dateDebut?: string | Date;
  dateFin?: string | Date;
  remarques?: string;
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

interface ActeMedical {
  _id: string;
  designation: string;
  designationTypeActe?: string;
  montant: number;
  date: string | Date;
  statut: string;
  StatutLaboratoire?: number;
  patientId?: string;
  codePrestation: string;
  Numfacture?: string;
  Entrele?: string | Date;
  SortieLe?: string | Date;
  Rclinique?: string;
  NomMed?: string;
}

interface LabResultat {
  _id: string;
  ParamAbrege?: string;
  Param_designation?: string;
  ValeurNormale?: string;
  ValeurMinNormale?: number;
  ValeurMaxNormale?: number;
  ChampResultat?: string;
  Interpretation?: string;
  unite?: string;
  resultatSaisiePar?: string;
  dateSaisieResultat?: string | Date;
}

interface ArretTravail {
  _id: string;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateDebut: string | Date;
  dateFin: string | Date;
  motif: string;
  medecinTraitant: string;
  statut: string;
  numeroDocument: string;
  dateCreation?: string | Date;
  typeArret?: string;
  dureeJours?: number;
  dateReprise?: string | Date;
  certificatMedical?: boolean;
  numeroCertificat?: string;
  observations?: string;
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
  const [actesMedicaux, setActesMedicaux] = useState<ActeMedical[]>([]);
  const [arretsTravail, setArretsTravail] = useState<ArretTravail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('consultations');
  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(null);
  const [expandedActe, setExpandedActe] = useState<string | null>(null);
  const [acteResultats, setActeResultats] = useState<Record<string, LabResultat[]>>({});
  const [antecedentForm, setAntecedentForm] = useState({
    AntecedentMedico: '',
    AnteChirurgico: '',
    AnteFamille: '',
    AutreAnte: '',
    AlergiePatient: ''
  });
  const [editingAntecedents, setEditingAntecedents] = useState(false);
  const [savingAntecedents, setSavingAntecedents] = useState(false);

  const toggleConsultation = (id: string) =>
    setExpandedConsultation(prev => (prev === id ? null : id));

  const toggleActe = async (id: string) => {
    if (expandedActe === id) {
      setExpandedActe(null);
      return;
    }
    setExpandedActe(id);
    if (!acteResultats[id]) {
      try {
        const res = await fetch(`/api/laboratoire/resultats/ligne/${id}`);
        if (res.ok) {
          const data = await res.json();
          setActeResultats(prev => ({
            ...prev,
            [id]: data.resultats || []
          }));
        }
      } catch (e) {
        console.error('Erreur chargement résultats labo:', e);
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
          setAntecedentForm({
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

        // Charger les prescriptions du patient
        const prescriptionsResponse = await fetch(`/api/ListePrescription?patientId=${patientId}`);
        if (prescriptionsResponse.ok) {
          const prescriptionsData = await prescriptionsResponse.json();
          setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : prescriptionsData.data || []);
        }

        // Charger les avis d'hospitalisation du patient
        const avisResponse = await fetch(`/api/avishospit?patientId=${patientId}`);
        if (avisResponse.ok) {
          const avisData = await avisResponse.json();
          setAvisHospit(avisData.data || []);
        }

        // Charger les actes médicaux / examens complémentaires du patient
        const actesResponse = await fetch(`/api/ListeAutreActes?patientId=${patientId}`);
        if (actesResponse.ok) {
          const actesData = await actesResponse.json();
          setActesMedicaux(Array.isArray(actesData) ? actesData : actesData.data || []);
        }

        // Charger les arrêts de travail du patient
        const arretsResponse = await fetch(`/api/arrettravail?patientId=${patientId}`);
        if (arretsResponse.ok) {
          const arretsData = await arretsResponse.json();
          setArretsTravail(arretsData.data || []);
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
          antecedents: {
            AntecedentMedico: antecedentForm.AntecedentMedico,
            AnteChirurgico: antecedentForm.AnteChirurgico,
            AnteFamille: antecedentForm.AnteFamille,
            AutreAnte: antecedentForm.AutreAnte,
            AlergiePatient: antecedentForm.AlergiePatient
          }
        })
      });
      if (res.ok) {
        setPatient(prev => prev ? {
          ...prev,
          AntecedentMedico: antecedentForm.AntecedentMedico,
          AnteChirurgico: antecedentForm.AnteChirurgico,
          AnteFamille: antecedentForm.AnteFamille,
          AutreAnte: antecedentForm.AutreAnte,
          AlergiePatient: antecedentForm.AlergiePatient
        } : prev);
        setEditingAntecedents(false);
      }
    } catch (e) {
      console.error('Erreur sauvegarde antécédents:', e);
    } finally {
      setSavingAntecedents(false);
    }
  };

  // Fonction d'impression du dossier patient
  const handlePrint = () => {
    const printContent = document.getElementById('dossier-patient-printable');
    if (!printContent) {
      window.print();
      return;
    }
    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Dossier Patient - ${patient?.Nom || ''} ${patient?.Prenoms || ''}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
          <style>
            body { padding: 20px; font-family: Arial, sans-serif; }
            .print-header { text-align: center; margin-bottom: 20px; }
            table { width: 100%; margin-bottom: 1rem; }
            th, td { border: 1px solid #dee2e6; padding: 8px; }
            .d-none { display: none !important; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>Dossier Patient Complet</h2>
            <h4>${patient?.Nom || ''} ${patient?.Prenoms || ''}</h4>
            <p>Code dossier : ${patient?.Code_dossier || ''}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
  const getStatutArretLibelle = (statut: string) => {
    const statuts: { [key: string]: string } = {
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'annule': 'Annulé'
    };
    return statuts[statut] || statut;
  };

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

  // Vue synthétique / timeline
  const timelineItems = useMemo(() => {
    const items: {
      id: string;
      type: 'consultation' | 'acte' | 'prescription';
      date: Date;
      title: string;
      badge: string;
      badgeColor: string;
      details: React.ReactNode;
    }[] = [];

    consultations.forEach(c => {
      items.push({
        id: `consultation-${c._id}`,
        type: 'consultation',
        date: new Date(c.Date_consulation),
        title: `Consultation ${c.CodePrestation}`,
        badge: 'Consultation',
        badgeColor: 'primary',
        details: (
          <div>
            <div><strong>Motif:</strong> {c.MotifConsultation || '—'}</div>
            <div><strong>Médecin:</strong> {c.Medecin || '—'}</div>
            <div><strong>Diagnostic:</strong> {c.Diagnostic || '—'}</div>
            {(c.Temperature || c.Poids || c.Tension || c.Glycemie) && (
              <div className="mt-1 small text-success">
                Constantes: {c.Temperature && `Temp. ${c.Temperature}°C `}{c.Poids && `Poids ${c.Poids}kg `}{c.Tension && `Tension ${c.Tension} `}{c.Glycemie && `Glyc. ${c.Glycemie}`}
              </div>
            )}
          </div>
        )
      });
    });

    actesMedicaux.forEach(a => {
      items.push({
        id: `acte-${a._id}`,
        type: 'acte',
        date: new Date(a.date),
        title: a.designation || a.designationTypeActe || 'Acte médical',
        badge: 'Acte',
        badgeColor: 'info',
        details: (
          <div>
            <div><strong>Code:</strong> {a.codePrestation}</div>
            <div><strong>Statut:</strong> {a.statut || '—'}</div>
            <div><strong>Montant:</strong> {a.montant || 0} FCFA</div>
            <div><strong>Médecin:</strong> {a.NomMed || '—'}</div>
          </div>
        )
      });
    });

    prescriptions.forEach(p => {
      items.push({
        id: `prescription-${p._id}`,
        type: 'prescription',
        date: new Date(p.date),
        title: p.designation || p.designationTypeActe || 'Prescription',
        badge: 'Prescription',
        badgeColor: 'success',
        details: (
          <div>
            <div><strong>Code:</strong> {p.codePrestation}</div>
            <div><strong>Montant:</strong> {p.montant || 0} FCFA</div>
            <div><strong>Statut:</strong> {p.statut ? 'Payé' : 'En attente'}</div>
            <div><strong>Prescrit par:</strong> {p.NomMed || '—'}</div>
          </div>
        )
      });
    });

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [consultations, actesMedicaux, prescriptions]);

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
        <div id="dossier-patient-printable">
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
                Consultations ({consultations.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="timeline">
                <FaList className="me-1" />
                Vue Synthétique ({timelineItems.length})
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
                Examens ({actesMedicaux.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="documents">
                <FaFileMedical className="me-1" />
                Documents ({arretsTravail.length})
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
                          <th style={{ width: 30 }}></th>
                          <th>Date</th>
                          <th>Code Prestation</th>
                          <th>Motif</th>
                          <th>Médecin</th>
                          <th className="text-center">Constantes</th>
                          <th>Diagnostic</th>
                          <th>Statut</th>
                          <th>Montant</th>
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
                              <tr style={{ cursor: 'pointer' }} className={isOpen ? 'table-primary' : ''} onClick={() => toggleConsultation(consultation._id)}>
                                <td className="text-center text-muted">
                                  {isOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                </td>
                                <td className="fw-semibold text-nowrap">{new Date(consultation.Date_consulation).toLocaleDateString('fr-FR')}</td>
                                <td className="text-primary fw-bold">{consultation.CodePrestation}</td>
                                <td>{consultation.MotifConsultation?.substring(0, 50) || 'N/A'}{consultation.MotifConsultation && consultation.MotifConsultation.length > 50 ? '...' : ''}</td>
                                <td>{consultation.Medecin || 'N/A'}</td>
                                <td className="text-center">
                                  {hasConstantes ? (
                                    <span className="text-success small">
                                      {consultation.Temperature && <span className="me-2" title="Temp."><FaThermometerHalf className="me-1" />{consultation.Temperature}°</span>}
                                      {consultation.Poids && <span className="me-2" title="Poids"><FaWeight className="me-1" />{consultation.Poids}kg</span>}
                                      {consultation.Tension && <span title="Tension"><FaHeartbeat className="me-1" />{consultation.Tension}</span>}
                                    </span>
                                  ) : <span className="text-muted small">—</span>}
                                </td>
                                <td>{consultation.Diagnostic?.substring(0, 30) || 'N/A'}{consultation.Diagnostic && consultation.Diagnostic.length > 30 ? '...' : ''}</td>
                                <td>
                                  <Badge bg={consultation.StatutPaiement === 'Payé' ? 'success' : 'warning'}>
                                    {consultation.StatutPaiement || 'N/A'}
                                  </Badge>
                                </td>
                                <td className="text-end">{consultation.montantapayer || 0} FCFA</td>
                              </tr>
                              {isOpen && (
                                <tr key={consultation._id + '_detail'}>
                                  <td colSpan={9} className="p-0 bg-light border-top-0">
                                    <div className="p-3">
                                      <Row className="g-3">
                                        {(consultation.Temperature || consultation.Poids || consultation.Tension || consultation.Glycemie) && (
                                          <Col md={12}>
                                            <div className="p-2 bg-white rounded border">
                                              <div className="small fw-bold text-secondary mb-2"><FaStethoscope className="me-1" />Constantes</div>
                                              <div className="d-flex flex-wrap gap-3 small">
                                                {consultation.Temperature && <span><strong>Température:</strong> {consultation.Temperature}°C</span>}
                                                {consultation.Poids && <span><strong>Poids:</strong> {consultation.Poids} kg</span>}
                                                {consultation.Tension && <span><strong>Tension:</strong> {consultation.Tension}</span>}
                                                {consultation.Glycemie && <span><strong>Glycémie:</strong> {consultation.Glycemie}</span>}
                                              </div>
                                            </div>
                                          </Col>
                                        )}
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
                                        {consultation.ConclusionClinique && (
                                          <Col md={6}>
                                            <div className="p-2 bg-white rounded border">
                                              <div className="small fw-bold text-success mb-1"><FaNotesMedical className="me-1" />Conclusion</div>
                                              <div className="small" style={{ whiteSpace: 'pre-line' }}>{consultation.ConclusionClinique}</div>
                                            </div>
                                          </Col>
                                        )}
                                        {consultation.TraitementClinique && (
                                          <Col md={6}>
                                            <div className="p-2 bg-white rounded border">
                                              <div className="small fw-bold text-warning mb-1"><FaPills className="me-1" />Traitement</div>
                                              <div className="small" style={{ whiteSpace: 'pre-line' }}>{consultation.TraitementClinique}</div>
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
                  ) : (
                    <div className="text-center py-4">
                      <FaHistory className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucune consultation trouvée</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Vue synthétique / Timeline */}
            <Tab.Pane eventKey="timeline">
              <Card>
                <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaList className="me-2" />Vue Synthétique du Dossier</h6>
                  <Badge bg="light" text="dark">{timelineItems.length} événement(s)</Badge>
                </Card.Header>
                <Card.Body>
                  {timelineItems.length > 0 ? (
                    <div className="position-relative ps-4">
                      <div className="position-absolute" style={{ left: 10, top: 0, bottom: 0, width: 2, backgroundColor: '#dee2e6' }}></div>
                      {timelineItems.map((item) => (
                        <div key={item.id} className="mb-3 position-relative">
                          <div
                            className="position-absolute rounded-circle"
                            style={{
                              left: -27,
                              top: 5,
                              width: 12,
                              height: 12,
                              backgroundColor: item.badgeColor === 'primary' ? '#0d6efd' : item.badgeColor === 'info' ? '#0dcaf0' : '#198754'
                            }}
                          ></div>
                          <div className="d-flex align-items-center mb-1">
                            <Badge bg={item.badgeColor} className="me-2">{item.badge}</Badge>
                            <span className="text-muted small">{item.date.toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="p-2 bg-light rounded border">
                            <div className="fw-bold">{item.title}</div>
                            <div className="small">{item.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaList className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun événement dans le dossier</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Antécédents */}
            <Tab.Pane eventKey="antecedents">
              <Card>
                <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Antécédents Médicaux</h6>
                  {!editingAntecedents ? (
                    <Button variant="outline-dark" size="sm" onClick={() => setEditingAntecedents(true)}>
                      <FaEdit className="me-1" /> Modifier
                    </Button>
                  ) : (
                    <div className="d-flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => {
                        setEditingAntecedents(false);
                        if (patient) {
                          setAntecedentForm({
                            AntecedentMedico: patient.AntecedentMedico || '',
                            AnteChirurgico: patient.AnteChirurgico || '',
                            AnteFamille: patient.AnteFamille || '',
                            AutreAnte: patient.AutreAnte || '',
                            AlergiePatient: patient.AlergiePatient || ''
                          });
                        }
                      }}>
                        Annuler
                      </Button>
                      <Button variant="success" size="sm" onClick={handleSaveAntecedents} disabled={savingAntecedents}>
                        {savingAntecedents ? <Spinner animation="border" size="sm" className="me-1" /> : <FaSave className="me-1" />}
                        Enregistrer
                      </Button>
                    </div>
                  )}
                </Card.Header>
                <Card.Body>
                  {patient && !editingAntecedents && (
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
                  {editingAntecedents && (
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold text-danger">Antécédents Médicaux</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={antecedentForm.AntecedentMedico}
                            onChange={(e) => setAntecedentForm(prev => ({ ...prev, AntecedentMedico: e.target.value }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold text-danger">Antécédents Chirurgicaux</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={antecedentForm.AnteChirurgico}
                            onChange={(e) => setAntecedentForm(prev => ({ ...prev, AnteChirurgico: e.target.value }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold text-info">Antécédents Familiaux</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={antecedentForm.AnteFamille}
                            onChange={(e) => setAntecedentForm(prev => ({ ...prev, AnteFamille: e.target.value }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold text-warning">Allergies</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={antecedentForm.AlergiePatient}
                            onChange={(e) => setAntecedentForm(prev => ({ ...prev, AlergiePatient: e.target.value }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold text-secondary">Autres Antécédents</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={antecedentForm.AutreAnte}
                            onChange={(e) => setAntecedentForm(prev => ({ ...prev, AutreAnte: e.target.value }))}
                          />
                        </Form.Group>
                      </Col>
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

            {/* Examens médicaux / actes complémentaires */}
            <Tab.Pane eventKey="examens">
              <Card>
                <Card.Header className="bg-info text-white">
                  <h6 className="mb-0">Examens et Actes Médicaux</h6>
                </Card.Header>
                <Card.Body>
                  {actesMedicaux.length > 0 ? (
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th style={{ width: 30 }}></th>
                          <th>Date</th>
                          <th>Code Prestation</th>
                          <th>Acte</th>
                          <th>Statut</th>
                          <th>Montant</th>
                          <th>Médecin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...actesMedicaux]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((acte) => {
                            const isOpen = expandedActe === acte._id;
                            const resultats = acteResultats[acte._id] || [];
                            return (
                              <React.Fragment key={acte._id}>
                                <tr style={{ cursor: 'pointer' }} className={isOpen ? 'table-info' : ''} onClick={() => toggleActe(acte._id)}>
                                  <td className="text-center text-muted">
                                    {isOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                  </td>
                                  <td className="fw-semibold text-nowrap">{new Date(acte.date).toLocaleDateString('fr-FR')}</td>
                                  <td className="text-primary fw-bold">{acte.codePrestation}</td>
                                  <td>{acte.designation || acte.designationTypeActe || 'N/A'}</td>
                                  <td>
                                    <Badge bg={acte.statut === 'Validé' ? 'success' : 'warning'}>
                                      {acte.statut || 'N/A'}
                                    </Badge>
                                  </td>
                                  <td className="text-end">{acte.montant || 0} FCFA</td>
                                  <td>{acte.NomMed || 'N/A'}</td>
                                </tr>
                                {isOpen && (
                                  <tr key={acte._id + '_resultats'}>
                                    <td colSpan={7} className="p-0 bg-light border-top-0">
                                      <div className="p-3">
                                        <h6 className="small fw-bold text-info mb-3">
                                          <FaMicroscope className="me-1" />
                                          Résultats de l'examen
                                        </h6>
                                        {resultats.length > 0 ? (
                                          <Table striped hover size="sm" className="mb-0">
                                            <thead>
                                              <tr>
                                                <th>Paramètre</th>
                                                <th>Résultat</th>
                                                <th>Unité</th>
                                                <th>Valeur normale</th>
                                                <th>Interprétation</th>
                                                <th>Saisi par</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {resultats.map((resultat) => (
                                                <tr key={resultat._id}>
                                                  <td>{resultat.Param_designation || resultat.ParamAbrege || 'N/A'}</td>
                                                  <td className="fw-bold">{resultat.ChampResultat || '—'}</td>
                                                  <td>{resultat.unite || '—'}</td>
                                                  <td>{resultat.ValeurNormale || '—'}</td>
                                                  <td>{resultat.Interpretation || '—'}</td>
                                                  <td>{resultat.resultatSaisiePar || '—'}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </Table>
                                        ) : (
                                          <div className="text-muted small">Aucun résultat enregistré pour cet examen.</div>
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
                  ) : (
                    <div className="text-center py-4">
                      <FaMicroscope className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun examen médical trouvé</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Documents / Arrêts de travail */}
            <Tab.Pane eventKey="documents">
              <Card>
                <Card.Header className="bg-secondary text-white">
                  <h6 className="mb-0"><FaBriefcaseMedical className="me-2" />Arrêts de Travail et Certificats</h6>
                </Card.Header>
                <Card.Body>
                  {arretsTravail.length > 0 ? (
                    <div>
                      {arretsTravail.map((arret) => (
                        <div key={arret._id} className="mb-4 p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="text-secondary mb-0">{arret.typeArret || 'Arrêt de travail'}</h6>
                            <Badge bg={arret.statut === 'en_cours' ? 'warning' : arret.statut === 'termine' ? 'success' : 'danger'}>
                              {getStatutArretLibelle(arret.statut)}
                            </Badge>
                          </div>
                          <Row>
                            <Col md={6}>
                              <Table striped hover size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">N° document:</td>
                                    <td>{arret.numeroDocument}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Date début:</td>
                                    <td>{new Date(arret.dateDebut).toLocaleDateString('fr-FR')}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Date fin:</td>
                                    <td>{new Date(arret.dateFin).toLocaleDateString('fr-FR')}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Durée:</td>
                                    <td>{arret.dureeJours ? `${arret.dureeJours} jour(s)` : 'N/A'}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </Col>
                            <Col md={6}>
                              <Table striped hover size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">Médecin:</td>
                                    <td>{arret.medecinTraitant}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Motif:</td>
                                    <td>{arret.motif}</td>
                                  </tr>
                                  {arret.dateReprise && (
                                    <tr>
                                      <td className="fw-bold">Reprise:</td>
                                      <td>{new Date(arret.dateReprise).toLocaleDateString('fr-FR')}</td>
                                    </tr>
                                  )}
                                  {arret.numeroCertificat && (
                                    <tr>
                                      <td className="fw-bold">N° certificat:</td>
                                      <td>{arret.numeroCertificat}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </Table>
                            </Col>
                          </Row>
                          {arret.observations && (
                            <div className="p-2 bg-light rounded mt-2">
                              <strong>Observations:</strong> {arret.observations}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaFileMedical className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun arrêt de travail ou certificat trouvé</p>
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
                          <th>Prescrit par</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((prescription) => (
                          <tr key={prescription._id}>
                            <td>{new Date(prescription.date).toLocaleDateString('fr-FR')}</td>
                            <td className="fw-bold">{prescription.designation || prescription.designationTypeActe || 'N/A'}</td>
                            <td className="text-end">{prescription.montant || 0} FCFA</td>
                            <td>
                              <Badge bg={prescription.statut ? 'success' : 'warning'}>
                                {prescription.statut ? 'Payé' : 'En attente'}
                              </Badge>
                            </td>
                            <td>{prescription.NomMed || 'N/A'}</td>
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
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          <FaFileAlt className="me-1" />
          Imprimer le Dossier
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
