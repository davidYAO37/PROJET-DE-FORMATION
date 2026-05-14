'use client';
import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Badge } from 'react-bootstrap';

// Interfaces basées sur les modèles MongoDB
interface IPatient {
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
  SocieteP?: string;
  SOCIETE_PATIENT?: string;
}

interface IConsultation {
  _id: string;
  CodePrestation: string;
  Date_consulation: Date;
  Heure_Consultation?: string;
  MotifConsultation?: string;
  ExamenClinique?: string;
  CodeAffection?: string;
  ExamenParaclinique?: string;
  TraitementClinique?: string;
  ConclusionClinique?: string;
  Diagnostic?: string;
  Temperature?: string;
  Poids?: string;
  Tension?: string;
  Glycemie?: string;
  TailleCons?: string;
  PrixClinique?: number;
  Prix_Assurance?: number;
  montantapayer?: number;
  Restapayer?: number;
  StatutPaiement?: string;
  Modepaiement?: string;
  NumBon?: string;
  IDMEDECIN?: string;
  Medecin?: string;
}

interface IPrescription {
  _id: string;
  Designation: string;
  CodePrestation?: string;
  DatePres: Date;
  Rclinique?: string;
  Montanttotal?: number;
  StatutPaiement?: string;
  Numfacture?: string;
  NumBon?: string;
  Modepaiement?: string;
  Payéoupas?: boolean;
  TotalapayerPatient?: number;
}

interface IAvisHospit {
  _id: string;
  serviceHospit: string;
  etatPatient: string;
  DureHospit: string;
  Patient: string;
  DateIntervention: Date;
  HeureHospit: string;
  NumDoc: string;
  MedecinTraitant: string;
  Diagnostic: string;
  DatePrevue: Date;
  assurance?: string;
  SocieteP?: string;
  Isolement?: boolean;
  HospitAnt?: boolean;
  sejourunjour?: boolean;
}

interface EtatMetierFichePrescriptionProps {
  consultationId?: string;
  patientId?: string;
  codePrestation?: string;
}

export default function EtatMetierFichePrescription({ 
  consultationId, 
  patientId, 
  codePrestation 
}: EtatMetierFichePrescriptionProps) {
  const [patient, setPatient] = useState<IPatient | null>(null);
  const [consultation, setConsultation] = useState<IConsultation | null>(null);
  const [prescriptions, setPrescriptions] = useState<IPrescription[]>([]);
  const [avisHospit, setAvisHospit] = useState<IAvisHospit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les données complètes pour l'état métier
  useEffect(() => {
    const chargerDonneesMetier = async () => {
      try {
        setLoading(true);
        
        // Déterminer le paramètre de recherche
        let searchParam = '';
        if (consultationId) {
          searchParam = `consultationId=${consultationId}`;
        } else if (patientId) {
          searchParam = `patientId=${patientId}`;
        } else if (codePrestation) {
          searchParam = `codePrestation=${codePrestation}`;
        }

        if (!searchParam) {
          setError('Aucun paramètre de recherche fourni');
          return;
        }

        // Charger les données principales
        const response = await fetch(`/api/fichePrescriptionMedecin?${searchParam}`);
        
        if (response.ok) {
          const data = await response.json();
          
          setPatient(data.patient || null);
          setConsultation(data.consultation || null);
          setPrescriptions(data.prescriptions || []);
          
          // Charger les prescriptions supplémentaires si nécessaire
          if (data.consultation?.CodePrestation || codePrestation) {
            const codePrest = data.consultation?.CodePrestation || codePrestation;
            try {
              const prescriptionsResponse = await fetch(`/api/patientprescription?CodePrestation=${codePrest}`);
              if (prescriptionsResponse.ok) {
                const prescriptionsData = await prescriptionsResponse.json();
                if (Array.isArray(prescriptionsData.data)) {
                  setPrescriptions(prev => [...prev, ...prescriptionsData.data]);
                }
              }
            } catch (err) {
              console.warn('Erreur lors du chargement des prescriptions supplémentaires:', err);
            }
          }
          
          // Charger les avis d'hospitalisation
          if (data.consultation?._id) {
            try {
              const avisResponse = await fetch(`/api/avishospit?consultationId=${data.consultation._id}`);
              if (avisResponse.ok) {
                const avisData = await avisResponse.json();
                setAvisHospit(avisData.data || []);
              }
            } catch (err) {
              console.warn('Erreur lors du chargement des avis d\'hospitalisation:', err);
            }
          }
        } else {
          throw new Error('Erreur lors du chargement des données');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerDonneesMetier();
  }, [consultationId, patientId, codePrestation]);

  // Auto-impression quand les données sont chargées
  useEffect(() => {
    if (!loading && !error && (patient || consultation)) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [loading, error, patient, consultation]);

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

  // Fonction pour obtenir le libellé de l'état patient
  const getEtatPatientLibelle = (etat: string) => {
    const etats: { [key: string]: string } = {
      'URGENT': 'Urgent',
      'SEMIURGENT': 'Semi-urgent',
      'ELECTIF': 'Électif'
    };
    return etats[etat] || etat;
  };

  // Calculer les totaux financiers
  const calculerTotaux = () => {
    const totalPrescriptions = prescriptions.reduce((sum, p) => sum + (p.Montanttotal || 0), 0);
    const totalConsultation = consultation?.montantapayer || 0;
    const totalGeneral = totalPrescriptions + totalConsultation;
    
    return {
      prescriptions: totalPrescriptions,
      consultation: totalConsultation,
      general: totalGeneral
    };
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement de l'état métier...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Erreur: {error}
        </div>
      </Container>
    );
  }

  const totaux = calculerTotaux();

  return (
    <Container className="py-4 etat-metier-container">
      {/* En-tête de l'état métier */}
      <div className="text-center mb-4 etat-metier-header">
        <h3 className="mb-2 fw-bold">ÉTAT MÉDICAL COMPLET</h3>
        <h5 className="mb-1 text-primary">Fiche de Consultation et Prescription</h5>
        <p className="text-muted mb-0">
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Informations Patient */}
      <Card className="mb-4 etat-metier-section">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-person-fill me-2"></i>
            INFORMATIONS PATIENT
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="30%">Nom:</td>
                    <td>{patient?.Nom || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Prénoms:</td>
                    <td>{patient?.Prenoms || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Âge:</td>
                    <td>{patient?.Age_partient || calculateAge(patient?.Date_naisse || new Date())} ans</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Sexe:</td>
                    <td>{patient?.sexe || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </Col>
            <Col md={6}>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="30%">Code dossier:</td>
                    <td>{patient?.Code_dossier || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Contact:</td>
                    <td>{patient?.Contact || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Assurance:</td>
                    <td>{patient?.Assurance || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Matricule:</td>
                    <td>{patient?.Matricule || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Informations Consultation */}
      <Card className="mb-4 etat-metier-section">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <i className="bi bi-clipboard-pulse me-2"></i>
            INFORMATIONS CONSULTATION
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="30%">Code Prestation:</td>
                    <td className="text-primary fw-bold">{consultation?.CodePrestation || codePrestation || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Date consultation:</td>
                    <td>{consultation?.Date_consulation ? new Date(consultation.Date_consulation).toLocaleDateString('fr-FR') : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Heure:</td>
                    <td>{consultation?.Heure_Consultation || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Médecin:</td>
                    <td>{consultation?.Medecin || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </Col>
            <Col md={6}>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="30%">Num Bon:</td>
                    <td>{consultation?.NumBon || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Statut paiement:</td>
                    <td>
                      <Badge bg={consultation?.StatutPaiement === 'Payé' ? 'success' : 'warning'}>
                        {consultation?.StatutPaiement || 'N/A'}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Mode paiement:</td>
                    <td>{consultation?.Modepaiement || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Montant à payer:</td>
                    <td className="text-danger fw-bold">{consultation?.montantapayer || 0} FCFA</td>
                  </tr>
                </tbody>
              </table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Constantes Vitales */}
      <Card className="mb-4 etat-metier-section">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">
            <i className="bi bi-activity me-2"></i>
            CONSTANTES VITALES
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <i className="bi bi-thermometer-half fs-3 text-danger mb-2"></i>
                <h6 className="mb-1">Température</h6>
                <p className="mb-0 fw-bold">{consultation?.Temperature || 'N/A'} °C</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <i className="bi bi-speedometer2 fs-3 text-primary mb-2"></i>
                <h6 className="mb-1">Poids</h6>
                <p className="mb-0 fw-bold">{consultation?.Poids || 'N/A'} kg</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <i className="bi bi-heart-pulse fs-3 text-success mb-2"></i>
                <h6 className="mb-1">Tension</h6>
                <p className="mb-0 fw-bold">{consultation?.Tension || 'N/A'} mmHg</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 bg-light rounded">
                <i className="bi bi-droplet fs-3 text-warning mb-2"></i>
                <h6 className="mb-1">Glycémie</h6>
                <p className="mb-0 fw-bold">{consultation?.Glycemie || 'N/A'} g/L</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Motif et Examen Clinique */}
      <Card className="mb-4 etat-metier-section">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            <i className="bi bi-stethoscope me-2"></i>
            EXAMEN MÉDICAL
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={12}>
              <h6 className="text-primary mb-2">Motif de Consultation:</h6>
              <div className="p-3 bg-light rounded">
                <p className="mb-0">{consultation?.MotifConsultation || 'Non spécifié'}</p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <h6 className="text-primary mb-2">Examen Clinique:</h6>
              <div className="p-3 bg-light rounded">
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                  {consultation?.ExamenClinique || 'Non spécifié'}
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Antécédents */}
      {(patient?.AntecedentMedico || patient?.AnteChirurgico || patient?.AnteFamille || patient?.AutreAnte || patient?.AlergiePatient) && (
        <Card className="mb-4 etat-metier-section">
          <Card.Header className="bg-secondary text-white">
            <h5 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              ANTÉCÉDENTS MÉDICAUX
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {patient?.AntecedentMedico && (
                <Col md={6} className="mb-3">
                  <h6 className="text-danger mb-2">
                    <i className="bi bi-heart-pulse me-1"></i>
                    Antécédents Médicaux
                  </h6>
                  <div className="p-2 bg-light rounded small">
                    {patient.AntecedentMedico}
                  </div>
                </Col>
              )}
              {patient?.AnteChirurgico && (
                <Col md={6} className="mb-3">
                  <h6 className="text-danger mb-2">
                    <i className="bi bi-scissors me-1"></i>
                    Antécédents Chirurgicaux
                  </h6>
                  <div className="p-2 bg-light rounded small">
                    {patient.AnteChirurgico}
                  </div>
                </Col>
              )}
              {patient?.AnteFamille && (
                <Col md={6} className="mb-3">
                  <h6 className="text-info mb-2">
                    <i className="bi bi-people me-1"></i>
                    Antécédents Familiaux
                  </h6>
                  <div className="p-2 bg-light rounded small">
                    {patient.AnteFamille}
                  </div>
                </Col>
              )}
              {patient?.AlergiePatient && (
                <Col md={6} className="mb-3">
                  <h6 className="text-warning mb-2">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Allergies
                  </h6>
                  <div className="p-2 bg-warning bg-opacity-10 rounded small">
                    {patient.AlergiePatient}
                  </div>
                </Col>
              )}
              {patient?.AutreAnte && (
                <Col md={12} className="mb-3">
                  <h6 className="text-secondary mb-2">
                    <i className="bi bi-dash-circle me-1"></i>
                    Autres Antécédents
                  </h6>
                  <div className="p-2 bg-light rounded small">
                    {patient.AutreAnte}
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Examens Paracliniques */}
      {consultation?.ExamenParaclinique && (
        <Card className="mb-4 etat-metier-section">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-microscope me-2"></i>
              EXAMENS PARACLINIQUES
            </h5>
          </Card.Header>
          <Card.Body>
            <div className="p-3 bg-light rounded">
              <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                {consultation.ExamenParaclinique}
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Traitement Clinique */}
      {consultation?.TraitementClinique && (
        <Card className="mb-4 etat-metier-section">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">
              <i className="bi bi-prescription me-2"></i>
              TRAITEMENT CLINIQUE
            </h5>
          </Card.Header>
          <Card.Body>
            <div className="p-3 bg-light rounded">
              <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                {consultation.TraitementClinique}
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Prescriptions Pharmaceutiques */}
      {prescriptions.length > 0 && (
        <Card className="mb-4 etat-metier-section">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-capsule me-2"></i>
              PRESCRIPTIONS PHARMACEUTIQUES
            </h5>
          </Card.Header>
          <Card.Body>
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Mode Paiement</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((prescription) => (
                  <tr key={prescription._id}>
                    <td className="fw-bold">{prescription.Designation}</td>
                    <td>{prescription.DatePres ? new Date(prescription.DatePres).toLocaleDateString('fr-FR') : 'N/A'}</td>
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
          </Card.Body>
        </Card>
      )}

      {/* Avis d'Hospitalisation */}
      {avisHospit.length > 0 && (
        <Card className="mb-4 etat-metier-section">
          <Card.Header className="bg-danger text-white">
            <h5 className="mb-0">
              <i className="bi bi-hospital me-2"></i>
              AVIS D'HOSPITALISATION
            </h5>
          </Card.Header>
          <Card.Body>
            {avisHospit.map((avis, index) => (
              <div key={avis._id} className="mb-4 p-3 border rounded">
                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-danger mb-2">Avis #{index + 1}</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="fw-bold" width="40%">Service:</td>
                          <td>{getServiceLibelle(avis.serviceHospit)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">État Patient:</td>
                          <td>
                            <Badge bg="danger">{getEtatPatientLibelle(avis.etatPatient)}</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Durée:</td>
                          <td>{avis.DureHospit}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Date Intervention:</td>
                          <td>{new Date(avis.DateIntervention).toLocaleDateString('fr-FR')}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Heure:</td>
                          <td>{avis.HeureHospit}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                  <Col md={6}>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="fw-bold" width="40%">Médecin Traitant:</td>
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
                          <td className="fw-bold">Numéro Document:</td>
                          <td>{avis.NumDoc || 'N/A'}</td>
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
                    </table>
                  </Col>
                </Row>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Conclusion et Diagnostic */}
      {(consultation?.ConclusionClinique || consultation?.Diagnostic || consultation?.CodeAffection) && (
        <Card className="mb-4 etat-metier-section">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">
              <i className="bi bi-clipboard-check me-2"></i>
              CONCLUSION ET DIAGNOSTIC
            </h5>
          </Card.Header>
          <Card.Body>
            {consultation?.Diagnostic && (
              <Row className="mb-3">
                <Col md={12}>
                  <h6 className="text-primary mb-2">Diagnostic:</h6>
                  <div className="p-3 bg-light rounded">
                    <p className="mb-0">{consultation.Diagnostic}</p>
                  </div>
                </Col>
              </Row>
            )}
            {consultation?.ConclusionClinique && (
              <Row className="mb-3">
                <Col md={12}>
                  <h6 className="text-primary mb-2">Conclusion Clinique:</h6>
                  <div className="p-3 bg-light rounded">
                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                      {consultation.ConclusionClinique}
                    </p>
                  </div>
                </Col>
              </Row>
            )}
            {consultation?.CodeAffection && (
              <Row>
                <Col md={12}>
                  <h6 className="text-primary mb-2">Codes CIM-10:</h6>
                  <div className="p-3 bg-light rounded">
                    <p className="mb-0">{consultation.CodeAffection}</p>
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Récapitulatif Financier */}
      <Card className="mb-4 etat-metier-section">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">
            <i className="bi bi-calculator me-2"></i>
            RÉCAPITULATIF FINANCIER
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <div className="text-center p-3 bg-light rounded">
                <h6 className="text-muted mb-2">Consultation</h6>
                <p className="mb-0 h4 text-primary">{totaux.consultation} FCFA</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3 bg-light rounded">
                <h6 className="text-muted mb-2">Prescriptions</h6>
                <p className="mb-0 h4 text-info">{totaux.prescriptions} FCFA</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3 bg-primary text-white rounded">
                <h6 className="mb-2">Total Général</h6>
                <p className="mb-0 h4">{totaux.general} FCFA</p>
              </div>
            </Col>
          </Row>
          {consultation?.Restapayer !== undefined && (
            <Row className="mt-3">
              <Col md={12}>
                <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                  <h6 className="text-warning mb-2">Reste à Payer</h6>
                  <p className="mb-0 h3 text-danger">{consultation.Restapayer} FCFA</p>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Pied de page de l'état métier */}
      <div className="text-center mt-4 etat-metier-footer">
        <hr />
        <p className="text-muted mb-2">
          <strong>ÉTAT MÉDICAL COMPLET - SYSTÈME DE GESTION MÉDICALE</strong>
        </p>
        <p className="text-muted mb-0 small">
          Code Prestation: {consultation?.CodePrestation || codePrestation || 'N/A'} | 
          Imprimé le {new Date().toLocaleString('fr-FR')} | 
          {consultation?.Medecin && ` Médecin: ${consultation.Medecin}`}
        </p>
      </div>

      {/* Styles CSS pour l'impression de l'état métier */}
      <style jsx>{`
        @media print {
          .etat-metier-container {
            max-width: 100%;
            margin: 0;
            padding: 15px;
            font-size: 11px;
          }
          
          .etat-metier-header {
            border-bottom: 3px double #007bff;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .etat-metier-footer {
            border-top: 2px solid #dee2e6;
            padding-top: 15px;
            margin-top: 20px;
            page-break-inside: avoid;
          }
          
          .etat-metier-section {
            page-break-inside: avoid;
            margin-bottom: 20px;
            border: 1px solid #dee2e6;
          }
          
          .card-header {
            background-color: #f8f9fa !important;
            color: #000 !important;
            border-bottom: 2px solid #dee2e6;
            font-weight: bold;
          }
          
          .table {
            page-break-inside: avoid;
            font-size: 10px;
          }
          
          .badge {
            background-color: #f8f9fa !important;
            color: #000 !important;
            border: 1px solid #dee2e6;
          }
          
          h3, h4, h5, h6 {
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .bg-light {
            background-color: #f8f9fa !important;
            border: 1px solid #dee2e6;
          }
          
          .text-primary, .text-danger, .text-success, .text-info, .text-warning {
            color: #000 !important;
            font-weight: bold;
          }
        }
      `}</style>
    </Container>
  );
}
