'use client';
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Button, Modal, Nav, Tab, Alert, Form, Spinner } from 'react-bootstrap';
import { FaUserInjured, FaHistory, FaNotesMedical, FaHospital, FaMicroscope, FaPills, FaFileAlt, FaThermometerHalf, FaWeight, FaHeartbeat, FaStethoscope, FaChevronDown, FaChevronRight, FaFileMedical, FaBriefcaseMedical, FaEdit, FaSave, FaPrint, FaImages, FaCheckCircle, FaClock, FaEye, FaClipboardList } from 'react-icons/fa';
import dynamic from 'next/dynamic';

const PrintFichePrescription = dynamic(
  () => import('@/app/pages/servicemedecin/MesImpressions/printFichePrescription'),
  { ssr: false }
);

const PrintCompteRendu = dynamic(
  () => import('@/app/pages/MesImpressions/PrintCompteRendu'),
  { ssr: false }
);

const HospitalisationsPatientModal = dynamic(
  () => import('@/app/pages/serviceinfirmier/tinfirmier/components/HospitalisationsPatientModal'),
  { ssr: false }
);

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
  Rclinique?: string;
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

interface PatientPrescriptionLine {
  _id: string;
  nomMedicament?: string;
  QteP?: number;
  posologie?: string;
  DatePres?: string | Date;
  administrePar?: string;
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

interface ExamenBiologique {
  _id: string;
  CodePrestation?: string;
  NomMed?: string;
  PatientP?: string;
  DatePres?: Date;
  Entrele?: Date;
  SaisiPar?: string;
  Rclinique?: string;
  resultatacte?: string;
  Biologiste?: string;
  dateSaisieResultat?: Date;
  DateValidation?: Date;
  resultatSaisiePar?: string;
  Designationtypeacte?: string;
  StatutLaboratoire?: number;
}

interface CompteRenduRadiologique {
  _id: string;
  IDHOSPITALISATION?: string;
  IDLIGNE_PRESTATION?: string;
  CodePrestation?: string;
  Prestation?: string;
  MedecinExécutant?: string;
  Résultatsaisiepar?: string;
  DatesaisieResultat?: string | Date;
  compterenduValidéLe?: string | Date;
  CompterenduValidépar?: string;
  ActeMedecin?: string;
  resultatacte?: string;
  Date_ligne_prestaion?: string | Date;
  lettreCle?: string;
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

interface ExamenHospit {
  _id: string;
  CodePrestation?: string;
  Designationtypeacte?: string;
  DatePres?: string | Date;
  NomMed?: string;
  Entrele?: string | Date;
  SortieLe?: string | Date;
  IdPatient?: string;
  Chambre?: string;
  litId?: string;
  ObservationHospitalisation?: string;
  chambreNumero?: string;
  chambreType?: string;
  litNumero?: string;
}

interface LignePrestation {
  _id: string;
  CodePrestation?: string;
  idHospitalisation?: string;
  dateLignePrestation?: string | Date;
  prestation: string;
  qte: number;
  prix: number;
  prixTotal: number;
  lettreCle?: string;
  ordonnancementAffichage?: number;
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
  const [printConsultationId, setPrintConsultationId] = useState<string | null>(null);
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
  const [examensHospit, setExamensHospit] = useState<ExamenHospit[]>([]);
  const [examensBiologiques, setExamensBiologiques] = useState<ExamenBiologique[]>([]);
  const [comptesRendusRadiologiques, setComptesRendusRadiologiques] = useState<CompteRenduRadiologique[]>([]);
  const [selectedRadioId, setSelectedRadioId] = useState<string | null>(null);
  const [selectedRadioValidationInfo, setSelectedRadioValidationInfo] = useState<{ validePar?: string; valideLe?: string } | null>(null);
  const [radioPrintData, setRadioPrintData] = useState<any>(null);
  const [radioPrintLoading, setRadioPrintLoading] = useState(false);
  const [radioPrintError, setRadioPrintError] = useState('');
  const [showRadioModal, setShowRadioModal] = useState(false);
  const [selectedAvisHospit, setSelectedAvisHospit] = useState<AvisHospit | null>(null);
  const [showAvisModal, setShowAvisModal] = useState(false);
  const [selectedExamenHospit, setSelectedExamenHospit] = useState<ExamenHospit | null>(null);
  const [showExamenHospitModal, setShowExamenHospitModal] = useState(false);
  const [expandedPrescriptionId, setExpandedPrescriptionId] = useState<string | null>(null);
  const [prescriptionLinesMap, setPrescriptionLinesMap] = useState<Record<string, PatientPrescriptionLine[]>>({});
  const [lignesPrestationsMap, setLignesPrestationsMap] = useState<Record<string, LignePrestation[]>>({});
  const [consultationDetails, setConsultationDetails] = useState<Record<string, {
    TraitementClinique?: string;
    ExamenParaclinique?: string;
    ExamenClinique?: string;
    ConclusionClinique?: string;
    Rclinique?: string;
    lignesPrestation?: LignePrestation[];
  }>>({});

  const toggleConsultation = async (id: string, codePrestation?: string) => {
    if (expandedConsultation === id) {
      setExpandedConsultation(null);
      return;
    }
    setExpandedConsultation(id);
    if (codePrestation && !consultationDetails[id]) {
      try {
        const res = await fetch(`/api/printficheprescription?codeConsultation=${codePrestation}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data && result.data.length > 0) {
            const data = result.data[0];
            setConsultationDetails(prev => ({
              ...prev,
              [id]: {
                TraitementClinique: data.TraitementClinique,
                ExamenParaclinique: data.ExamenParaclinique,
                ExamenClinique: data.ExamenClinique,
                ConclusionClinique: data.ConclusionClinique,
                Rclinique: data.Rclinique,
                lignesPrestation: data.lignesPrestation || []
              }
            }));
          }
        }
      } catch (e) {
        console.error('Erreur chargement détails consultation:', e);
      }
    }
  };

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

  const afficherCompteRenduRadio = (examen: CompteRenduRadiologique) => {
    if (!examen.Résultatsaisiepar || examen.Résultatsaisiepar.trim() === '') {
      alert('Aucun résultat à imprimer');
      return;
    }
    setSelectedRadioId(examen._id);
    setSelectedRadioValidationInfo({
      validePar: examen.CompterenduValidépar,
      valideLe: examen.compterenduValidéLe
        ? new Date(examen.compterenduValidéLe).toLocaleDateString('fr-FR')
        : undefined
    });
    setShowRadioModal(true);
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

        // Charger les examens d'hospitalisation du patient
        const examensResponse = await fetch(`/api/examenhospitalisation/patient?patientId=${patientId}`);
        if (examensResponse.ok) {
          const examensData = await examensResponse.json();
          setExamensHospit(examensData.data || []);
        }

        // Charger les examens biologiques du patient
        const bioResponse = await fetch(`/api/examenhospitalisation/biologiques?patientId=${patientId}`);
        if (bioResponse.ok) {
          const bioData = await bioResponse.json();
          setExamensBiologiques(bioData.data || []);
        }

        // Charger les comptes rendus radiologiques du patient
        const radioResponse = await fetch(`/api/compteRenduRadio/patientPrestations?patientId=${patientId}`);
        if (radioResponse.ok) {
          const radioData = await radioResponse.json();
          setComptesRendusRadiologiques(radioData.lignePrestations || []);
        }

        // Charger les lignes de prestation liées aux examens d'hospitalisation du patient
        const lignesResponse = await fetch(`/api/ligneprestation?patientId=${patientId}`);
        if (lignesResponse.ok) {
          const lignesData = await lignesResponse.json();
          const lignes = Array.isArray(lignesData) ? lignesData : (lignesData.data || []);
          const map: Record<string, LignePrestation[]> = {};
          lignes.forEach((l: any) => {
            const idHosp = String(l.idHospitalisation || '');
            if (!map[idHosp]) map[idHosp] = [];
            map[idHosp].push(l);
          });
          setLignesPrestationsMap(map);
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

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('fr-FR');
  };

  const getStatutCREtiquette = (examen: CompteRenduRadiologique) => {
    if (examen.CompterenduValidépar) {
      return <span className="d-inline-flex align-items-center px-2 py-1 rounded-pill bg-success bg-opacity-10 text-success small fw-semibold"><FaCheckCircle className="me-1" />Validé</span>;
    } else if (examen.Résultatsaisiepar) {
      return <span className="d-inline-flex align-items-center px-2 py-1 rounded-pill bg-warning bg-opacity-10 text-warning small fw-semibold"><FaClock className="me-1" />En attente de validation</span>;
    } else {
      return <span className="d-inline-flex align-items-center px-2 py-1 rounded-pill bg-danger bg-opacity-10 text-danger small fw-semibold"><FaEdit className="me-1" />À saisir</span>;
    }
  };

  const chargerLignesPrescription = async (prescriptionId: string) => {
    try {
      const res = await fetch(`/api/patientprescription?IDPRESCRIPTION=${prescriptionId}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setPrescriptionLinesMap((prev) => ({
        ...prev,
        [prescriptionId]: Array.isArray(data) ? data : data.data || [],
      }));
    } catch {
      setPrescriptionLinesMap((prev) => ({ ...prev, [prescriptionId]: [] }));
    }
  };

  const togglePrescriptionLines = async (prescriptionId: string) => {
    if (expandedPrescriptionId === prescriptionId) {
      setExpandedPrescriptionId(null);
    } else {
      setExpandedPrescriptionId(prescriptionId);
      if (!prescriptionLinesMap[prescriptionId]) {
        await chargerLignesPrescription(prescriptionId);
      }
    }
  };

  // Chargement du compte rendu radiologique sélectionné
  useEffect(() => {
    if (!selectedRadioId) {
      setRadioPrintData(null);
      setRadioPrintError('');
      setSelectedRadioValidationInfo(null);
      return;
    }

    const fetchRadioPrintData = async () => {
      setRadioPrintLoading(true);
      setRadioPrintError('');
      try {
        const res = await fetch(`/api/compteRenduRadio/imprimer/${selectedRadioId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.code === 'NO_RESULTAT_A_IMPRIMER') {
            throw new Error('Aucun résultat à imprimer');
          }
          throw new Error(data.message || data.error || 'Erreur lors du chargement du compte rendu');
        }
        const data = await res.json();
        if (!data.success || !data.donnees) {
          throw new Error('Données de compte rendu invalides');
        }
        setRadioPrintData(data.donnees);
      } catch (err: any) {
        console.error('Erreur chargement compte rendu radio:', err);
        setRadioPrintError(err.message || 'Impossible de charger le compte rendu');
      } finally {
        setRadioPrintLoading(false);
      }
    };

    fetchRadioPrintData();
  }, [selectedRadioId]);

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
              <Nav.Link eventKey="antecedents">
                <FaNotesMedical className="me-1" />
                Antécédents
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="hospitalisations">
                <FaHospital className="me-1" />
                Avis Hospitalisation ({avisHospit.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="examens-hospit">
                <FaClipboardList className="me-1" />
                Liste des hospitalisations ({examensHospit.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="examens">
                <FaMicroscope className="me-1" />
                Resultats Biologique  ({examensBiologiques.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="radiologie">
                <FaImages className="me-1" />
                Compte Rendu Radiologique ({comptesRendusRadiologiques.length})
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
                    <div className="table-responsive" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                      <Table striped hover>
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                          <tr>
                            <th style={{ width: 30 }}></th>
                            <th>Date</th>
                            <th>Code Prestation</th>
                            <th>Motif</th>
                            <th>Médecin</th>
                            <th className="text-center">Constantes</th>
                            <th>Diagnostic</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                        {[...consultations]
                          .sort((a, b) => new Date(b.Date_consulation).getTime() - new Date(a.Date_consulation).getTime())
                          .map((consultation) => {
                          const isOpen = expandedConsultation === consultation._id;
                          const hasConstantes = consultation.Poids || consultation.Temperature || consultation.Tension || consultation.Glycemie;
                          const details = consultationDetails[consultation._id] || {};
                          return (
                            <React.Fragment key={consultation._id}>
                              <tr style={{ cursor: 'pointer' }} className={isOpen ? 'table-primary' : ''} onClick={() => toggleConsultation(consultation._id, consultation.CodePrestation)}>
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
                                <td className="text-center">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    title="Imprimer la fiche prescription"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPrintConsultationId(consultation.CodePrestation);
                                    }}
                                  >
                                    <FaPrint />
                                  </Button>
                                </td>
                              </tr>
                              {isOpen && (
                                <tr key={consultation._id + '_detail'}>
                                  <td colSpan={9} className="p-0 bg-light border-top-0">
                                    <div className="p-3">
                                      {/* Ligne 1 : Renseignement clinique + Constantes */}
                                      <Row className="g-3 mb-3">
                                        {(details.Rclinique || consultation.Rclinique) && (
                                          <Col md={6} key={`${consultation._id}-rclinique`}>
                                            <div className="p-2 bg-white rounded border h-100">
                                              <div className="small fw-bold text-primary mb-1"><FaMicroscope className="me-1" />Renseignement Clinique</div>
                                              <div className="small" style={{ whiteSpace: 'pre-line' }}>{details.Rclinique || consultation.Rclinique}</div>
                                            </div>
                                          </Col>
                                        )}
                                        {(consultation.Temperature || consultation.Poids || consultation.Tension || consultation.Glycemie) && (
                                          <Col md={6} key={`${consultation._id}-constantes`}>
                                            <div className="p-2 bg-white rounded border h-100">
                                              <div className="small fw-bold text-secondary mb-2"><FaStethoscope className="me-1" />Constantes</div>
                                              <div className="d-flex flex-wrap gap-3 small">
                                                {consultation.Temperature && <span key="temp"><strong>Température:</strong> {consultation.Temperature}°C</span>}
                                                {consultation.Poids && <span key="poids"><strong>Poids:</strong> {consultation.Poids} kg</span>}
                                                {consultation.Tension && <span key="tension"><strong>Tension:</strong> {consultation.Tension}</span>}
                                                {consultation.Glycemie && <span key="glycemie"><strong>Glycémie:</strong> {consultation.Glycemie}</span>}
                                              </div>
                                            </div>
                                          </Col>
                                        )}
                                      </Row>

                                      {/* Ligne 2 : Examen Clinique + Examen Paraclinique */}
                                      <Row className="g-3 mb-3">
                                        {(details.ExamenClinique || consultation.ExamenClinique) && (
                                          <Col md={6} key={`${consultation._id}-examen-clinique`}>
                                            <div className="p-2 bg-white rounded border h-100">
                                              <div className="small fw-bold text-primary mb-1"><FaMicroscope className="me-1" />Examen Clinique</div>
                                              <div className="small" style={{ whiteSpace: 'pre-line' }}>{details.ExamenClinique || consultation.ExamenClinique}</div>
                                            </div>
                                          </Col>
                                        )}
                                        {(() => {
                                          const examensParacliniques = details.lignesPrestation?.filter((ligne) =>
                                            !!ligne.lettreCle && ["K", "KC", "B", "Z", "D"].includes(ligne.lettreCle)
                                          ) || [];
                                          const hasExamenParaclinique = details.ExamenParaclinique || consultation.ExamenParaclinique || examensParacliniques.length > 0;
                                          return hasExamenParaclinique ? (
                                            <Col md={6} key={`${consultation._id}-examen-paraclinique`}>
                                              <div className="p-2 bg-white rounded border h-100">
                                                <div className="small fw-bold text-info mb-1"><FaMicroscope className="me-1" />Examen Paraclinique</div>
                                                {details.ExamenParaclinique || consultation.ExamenParaclinique ? (
                                                  <div className="small" style={{ whiteSpace: 'pre-line' }}>{details.ExamenParaclinique || consultation.ExamenParaclinique}</div>
                                                ) : examensParacliniques.length > 0 ? (
                                                  <div>
                                                    {examensParacliniques
                                                      .sort((a, b) => (a.ordonnancementAffichage || 0) - (b.ordonnancementAffichage || 0))
                                                      .map((ligne, index) => (
                                                        <span key={`${consultation._id}-para-${ligne._id}`} className="small">
                                                          {ligne.prestation}
                                                          {index < examensParacliniques.length - 1 && ' - '}
                                                        </span>
                                                      ))}
                                                  </div>
                                                ) : null}
                                              </div>
                                            </Col>
                                          ) : null;
                                        })()}
                                      </Row>

                                      {/* Ligne 3 : Traitement + Conclusion */}
                                      <Row className="g-3">
                                        {(details.TraitementClinique || consultation.TraitementClinique) && (
                                          <Col md={6} key={`${consultation._id}-traitement`}>
                                            <div className="p-2 bg-white rounded border h-100">
                                              <div className="small fw-bold text-warning mb-1"><FaPills className="me-1" />Traitement</div>
                                              <div className="small" style={{ whiteSpace: 'pre-line' }}>{details.TraitementClinique || consultation.TraitementClinique}</div>
                                            </div>
                                          </Col>
                                        )}
                                        {(details.ConclusionClinique || consultation.ConclusionClinique) && (
                                          <Col md={6} key={`${consultation._id}-conclusion`}>
                                            <div className="p-2 bg-white rounded border h-100">
                                              <div className="small fw-bold text-success mb-1"><FaNotesMedical className="me-1" />Conclusion</div>
                                              <div className="small" style={{ whiteSpace: 'pre-line' }}>{details.ConclusionClinique || consultation.ConclusionClinique}</div>
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
                        <Col md={6} className="mb-3" key="antecedent-medical">
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
                        <Col md={6} className="mb-3" key="antecedent-chirurgical">
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
                        <Col md={6} className="mb-3" key="antecedent-familial">
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
                        <Col md={6} className="mb-3" key="antecedent-allergies">
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
                        <Col md={12} className="mb-3" key="antecedent-autre">
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
                        <Col md={12} key="antecedent-aucun">
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
                <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaHospital className="me-2" />Historique des Avis</h6>
                  <span className="d-inline-flex align-items-center justify-content-center px-2 py-1 rounded-pill bg-white text-danger small fw-semibold" style={{ minWidth: '24px' }}>{avisHospit.length}</span>
                </Card.Header>
                <Card.Body>
                  {avisHospit.length > 0 ? (
                    <Row className="g-3">
                      {avisHospit
                        .sort((a, b) => new Date(b.DateIntervention || 0).getTime() - new Date(a.DateIntervention || 0).getTime())
                        .map((avis) => (
                          <Col md={6} lg={4} key={avis._id}>
                            <Card className="h-100 shadow-sm">
                              <Card.Header className="bg-light py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 small fw-bold text-danger">{getServiceLibelle(avis.serviceHospit)}</h6>
                                  <span className={`d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-semibold ${
                                    avis.etatPatient === 'Urgent' ? 'bg-danger bg-opacity-10 text-danger' :
                                    avis.etatPatient === 'Semi-Urgent' ? 'bg-warning bg-opacity-10 text-warning' :
                                    'bg-success bg-opacity-10 text-success'
                                  }`}>
                                    {avis.etatPatient}
                                  </span>
                                </div>
                              </Card.Header>
                              <Card.Body className="p-3 small">
                                <div className="mb-2">
                                  <strong>Date intervention :</strong> {formatDate(avis.DateIntervention)}
                                </div>
                                <div className="mb-2">
                                  <strong>Heure :</strong> {avis.HeureHospit || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Durée :</strong> {avis.DureHospit || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Médecin traitant :</strong> {avis.MedecinTraitant || 'N/A'}
                                </div>
                                <div className="mb-3">
                                  <strong>Diagnostic :</strong>
                                  <div className="text-muted" style={{ whiteSpace: 'pre-line' }}>
                                    {avis.Diagnostic?.length > 60 ? `${avis.Diagnostic.substring(0, 60)}...` : (avis.Diagnostic || 'N/A')}
                                  </div>
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="w-100"
                                  onClick={() => {
                                    setSelectedAvisHospit(avis);
                                    setShowAvisModal(true);
                                  }}
                                >
                                  <FaEye className="me-1" /> Voir Observation
                                </Button>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <FaHospital className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucune hospitalisation trouvée</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Historique Hospitalisation */}
            <Tab.Pane eventKey="examens-hospit">
              <Card>
                <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaClipboardList className="me-2" />Historique d'Hospitalisation</h6>
                  <span className="d-inline-flex align-items-center justify-content-center px-2 py-1 rounded-pill bg-white text-success small fw-semibold" style={{ minWidth: '24px' }}>{examensHospit.length}</span>
                </Card.Header>
                <Card.Body>
                  {examensHospit.length > 0 ? (
                    <Row className="g-3">
                      {examensHospit
                        .sort((a, b) => new Date(b.Entrele || b.DatePres || 0).getTime() - new Date(a.Entrele || a.DatePres || 0).getTime())
                        .map((examen) => (
                          <Col md={6} lg={4} key={examen._id}>
                            <Card className="h-100 shadow-sm">
                              <Card.Header className="bg-light py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 small fw-bold text-danger">{examen.Designationtypeacte || 'Examen hospitalisation'}</h6>
                                  <span className="d-inline-flex align-items-center px-2 py-1 rounded-pill bg-info bg-opacity-10 text-info small fw-semibold">{examen.CodePrestation || 'N/A'}</span>
                                </div>
                              </Card.Header>
                              <Card.Body className="p-3 small">
                                <div className="mb-2">
                                  <strong>Type d'acte :</strong> {examen.Designationtypeacte || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>N° prestation :</strong> {examen.CodePrestation || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Date prescription :</strong> {formatDate(examen.DatePres)}
                                </div>
                                <div className="mb-2">
                                  <strong>Entré le :</strong> {formatDate(examen.Entrele)}
                                </div>
                                <div className="mb-2">
                                  <strong>Sorti le :</strong> {formatDate(examen.SortieLe)}
                                </div>
                                <div className="mb-2">
                                  <strong>Médecin :</strong> {examen.NomMed || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Chambre :</strong> {examen.chambreNumero || examen.Chambre || 'N/A'} {examen.chambreType ? `(${examen.chambreType})` : ''}
                                </div>
                                <div className="mb-3">
                                  <strong>Lit :</strong> {examen.litNumero || examen.litId || 'N/A'}
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="w-100"
                                  onClick={() => {
                                    setSelectedExamenHospit(examen);
                                    setShowExamenHospitModal(true);
                                  }}
                                >
                                  <FaEye className="me-1" /> Voir Observation
                                </Button>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <FaClipboardList className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun examen d'hospitalisation trouvé</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Résultats Biologiques */}
            <Tab.Pane eventKey="examens">
              <Card>
                <Card.Header className="bg-info text-white">
                  <h6 className="mb-0">Résultats Biologiques</h6>
                </Card.Header>
                <Card.Body>
                  {examensBiologiques.length > 0 ? (
                    <Row className="g-3">
                      {examensBiologiques
                        .sort((a, b) => new Date(b.DatePres || b.Entrele || 0).getTime() - new Date(a.DatePres || a.Entrele || 0).getTime())
                        .map((examen) => (
                          <Col md={6} lg={4} key={examen._id}>
                            <Card className="h-100 shadow-sm">
                              <Card.Header className="bg-light py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 small fw-bold text-primary">N° {examen.CodePrestation || 'N/A'}</h6>
                                  {(() => {
                                    const statusMap: Record<number, { label: string; color: string; title: string; pointer: boolean }> = {
                                      1: { label: 'Non reçu', color: 'bg-danger', title: 'Patient non reçu au laboratoire', pointer: true },
                                      2: { label: 'Réceptionné', color: 'bg-info', title: 'Résultat en cours de traitement à la saisie', pointer: true },
                                      3: { label: 'Transmission', color: 'bg-warning', title: 'Résultat en attente de validation', pointer: true },
                                      4: { label: 'Validé', color: 'bg-success', title: 'Résultat validé', pointer: true },
                                      5: { label: 'Retour', color: 'bg-secondary', title: 'Retour pour reprise de saisie', pointer: true }
                                    };
                                    const status = statusMap[examen.StatutLaboratoire || 0] || { label: 'Inconnu', color: 'bg-light text-dark', title: '', pointer: false };
                                    return (
                                      <span className={`px-2 py-1 rounded-pill ${status.color} ${status.pointer ? 'cursor-pointer' : ''}`} title={status.title}>
                                        {status.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </Card.Header>
                              <Card.Body className="p-3">
                                <div className="small mb-2">
                                  <strong>Date prescription:</strong> {examen.DatePres ? new Date(examen.DatePres).toLocaleDateString('fr-FR') : 'N/A'}
                                </div>
                                <div className="small mb-2">
                                  <strong>Médecin prescripteur:</strong> {examen.NomMed || 'N/A'}
                                </div>
                                {examen.Rclinique && (
                                  <div className="small mb-2">
                                    <strong>Renseignement clinique:</strong>
                                    <div className="text-muted" style={{ whiteSpace: 'pre-line' }}>{examen.Rclinique}</div>
                                  </div>
                                )}
                                <div className="small mb-2">
                                  <strong>Biologiste:</strong> {examen.Biologiste || 'N/A'}
                                </div>
                                <div className="small mb-3">
                                  <strong>Validé le:</strong> {examen.DateValidation ? new Date(examen.DateValidation).toLocaleDateString('fr-FR') : (examen.dateSaisieResultat ? new Date(examen.dateSaisieResultat).toLocaleDateString('fr-FR') : 'N/A')}
                                </div>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="w-100"
                                  onClick={() => {
                                    window.open(`/api/laboratoire/resultat/${examen._id}/pdf?avecEntete=true`, '_blank');
                                  }}
                                >
                                  <FaMicroscope className="me-1" /> Afficher le résultat
                                </Button>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <FaMicroscope className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun résultat biologique trouvé</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Compte Rendu Radiologique */}
            <Tab.Pane eventKey="radiologie">
              <Card>
                <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaImages className="me-2" />Comptes Rendus Radiologiques</h6>
                  <span className="d-inline-flex align-items-center justify-content-center px-2 py-1 rounded-pill bg-white text-secondary small fw-semibold" style={{ minWidth: '24px' }}>{comptesRendusRadiologiques.length}</span>
                </Card.Header>
                <Card.Body>
                  {comptesRendusRadiologiques.length > 0 ? (
                    <Row className="g-3">
                      {comptesRendusRadiologiques
                        .sort((a, b) => new Date(b.DatesaisieResultat || b.Date_ligne_prestaion || 0).getTime() - new Date(a.DatesaisieResultat || a.Date_ligne_prestaion || 0).getTime())
                        .map((examen) => (
                          <Col md={6} lg={4} key={examen._id}>
                            <Card className="h-100 shadow-sm">
                              <Card.Header className="bg-light py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 small fw-bold text-primary">{examen.Prestation || 'N/A'}</h6>
                                  {getStatutCREtiquette(examen)}
                                </div>
                              </Card.Header>
                              <Card.Body className="p-3 small">
                                <div className="mb-2">
                                  <strong>N° prestation :</strong> {examen.CodePrestation || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Date prestation :</strong> {formatDate(examen.Date_ligne_prestaion)}
                                </div>
                                <div className="mb-2">
                                  <strong>Lettre clé :</strong> {examen.lettreCle ? <span className="text-info">{examen.lettreCle}</span> : 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Médecin exécutant :</strong> {examen.MedecinExécutant || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Saisi par :</strong> {examen.Résultatsaisiepar || 'N/A'}
                                </div>
                                <div className="mb-2">
                                  <strong>Saisi le :</strong> {formatDateTime(examen.DatesaisieResultat)}
                                </div>
                                <div className="mb-2">
                                  <strong>Validé par :</strong> {examen.CompterenduValidépar || 'N/A'}
                                </div>
                                <div className="mb-3">
                                  <strong>Validé le :</strong> {formatDateTime(examen.compterenduValidéLe)}
                                </div>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="w-100"
                                  onClick={() => afficherCompteRenduRadio(examen)}
                                >
                                  <FaEye className="me-1" /> Voir le compte rendu
                                </Button>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <FaImages className="text-muted fs-1 mb-3" />
                      <p className="text-muted">Aucun compte rendu radiologique trouvé</p>
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
                            <span className={`d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-semibold ${
                              arret.statut === 'en_cours' ? 'bg-warning bg-opacity-10 text-warning' :
                              arret.statut === 'termine' ? 'bg-success bg-opacity-10 text-success' :
                              'bg-danger bg-opacity-10 text-danger'
                            }`}>
                              {getStatutArretLibelle(arret.statut)}
                            </span>
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
                <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0"><FaPills className="me-2" />Historique des Prescriptions</h6>
                  <span className="d-inline-flex align-items-center justify-content-center px-2 py-1 rounded-pill bg-white text-success small fw-semibold" style={{ minWidth: '24px' }}>{prescriptions.length}</span>
                </Card.Header>
                <Card.Body>
                  {prescriptions.length > 0 ? (
                    <Table striped hover responsive size="sm">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}></th>
                          <th>Date</th>
                          <th>N° Prestation</th>
                          <th>Médecin prescripteur</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((prescription) => (
                          <React.Fragment key={prescription._id}>
                            <tr>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                  onClick={() => togglePrescriptionLines(prescription._id)}
                                  aria-label="Déplier les lignes de prescription"
                                >
                                  {expandedPrescriptionId === prescription._id ? <FaChevronDown /> : <FaChevronRight />}
                                </Button>
                              </td>
                              <td>{formatDate(prescription.date)}</td>
                              <td>{prescription.codePrestation || 'N/A'}</td>
                              <td>{prescription.NomMed || 'N/A'}</td>
                              <td>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => setPrintConsultationId(prescription._id)}
                                >
                                  <FaPrint className="me-1" /> Imprimer
                                </Button>
                              </td>
                            </tr>
                            {expandedPrescriptionId === prescription._id && (
                              <tr>
                                <td colSpan={5} className="p-0">
                                  <div className="bg-light p-3">
                                    <h6 className="small fw-bold text-success mb-2">Lignes de prescription</h6>
                                    {(prescriptionLinesMap[prescription._id] || []).length > 0 ? (
                                      <Table striped bordered hover size="sm" className="mb-0">
                                        <thead className="table-success">
                                          <tr>
                                            <th>Date</th>
                                            <th>Médicament</th>
                                            <th>Qté</th>
                                            <th>Posologie</th>
                                            <th>Ajouté par</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(prescriptionLinesMap[prescription._id] || []).map((line) => (
                                            <tr key={line._id}>
                                              <td>{formatDate(line.DatePres)}</td>
                                              <td className="fw-semibold">{line.nomMedicament || 'N/A'}</td>
                                              <td>{line.QteP ?? 'N/A'}</td>
                                              <td>{line.posologie || 'N/A'}</td>
                                              <td>{line.administrePar || 'N/A'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </Table>
                                    ) : (
                                      <p className="text-muted small mb-0">Aucune ligne de prescription.</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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

    <Modal
      show={!!printConsultationId}
      onHide={() => setPrintConsultationId(null)}
      size="lg"
      fullscreen
    >
      <Modal.Header closeButton>
        <Modal.Title>Fiche de prescription</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {printConsultationId && (
          <PrintFichePrescription
            consultationId={printConsultationId}
            patientId={patient?._id}
            patientNom={patient?.Nom}
            patientPrenoms={patient?.Prenoms}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setPrintConsultationId(null)}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal
      show={showRadioModal}
      onHide={() => setShowRadioModal(false)}
      size="lg"
      fullscreen
    >
      <Modal.Header closeButton>
        <Modal.Title>Compte rendu radiologique</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {radioPrintLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2 mb-0">Chargement du compte rendu...</p>
          </div>
        ) : radioPrintError ? (
          <Alert variant="danger" className="mb-0">{radioPrintError}</Alert>
        ) : radioPrintData ? (
          <PrintCompteRendu donnees={radioPrintData} validationInfo={selectedRadioValidationInfo || undefined} />
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowRadioModal(false)}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal
      show={showAvisModal}
      onHide={() => setShowAvisModal(false)}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title><FaHospital className="me-2" />Observation hospitalisation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedAvisHospit ? (
          <div className="small">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold text-danger">{getServiceLibelle(selectedAvisHospit.serviceHospit)}</h6>
              <span className={`d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-semibold ${
                selectedAvisHospit.etatPatient === 'Urgent' ? 'bg-danger bg-opacity-10 text-danger' :
                selectedAvisHospit.etatPatient === 'Semi-Urgent' ? 'bg-warning bg-opacity-10 text-warning' :
                'bg-success bg-opacity-10 text-success'
              }`}>
                {selectedAvisHospit.etatPatient}
              </span>
            </div>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <div className="p-2 bg-light rounded">
                  <div className="text-muted mb-1">Date intervention</div>
                  <div className="fw-semibold">{formatDate(selectedAvisHospit.DateIntervention)}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-2 bg-light rounded">
                  <div className="text-muted mb-1">Heure</div>
                  <div className="fw-semibold">{selectedAvisHospit.HeureHospit || 'N/A'}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-2 bg-light rounded">
                  <div className="text-muted mb-1">Durée probable</div>
                  <div className="fw-semibold">{selectedAvisHospit.DureHospit || 'N/A'}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-2 bg-light rounded">
                  <div className="text-muted mb-1">Date prévue</div>
                  <div className="fw-semibold">{formatDate(selectedAvisHospit.DatePrevue)}</div>
                </div>
              </Col>
            </Row>

            <div className="p-3 bg-light rounded mb-3">
              <div className="text-muted mb-1">Médecin traitant</div>
              <div className="fw-semibold">{selectedAvisHospit.MedecinTraitant || 'N/A'}</div>
            </div>

            <div className="p-3 border rounded">
              <div className="fw-bold text-secondary mb-2">Diagnostic / Observation</div>
              <div style={{ whiteSpace: 'pre-line' }}>{selectedAvisHospit.Diagnostic || 'Aucune observation'}</div>
            </div>

            {(selectedAvisHospit.Isolement || selectedAvisHospit.HospitAnt || selectedAvisHospit.sejourunjour) && (
              <div className="mt-3">
                <div className="fw-bold text-secondary mb-2">Options</div>
                <div className="d-flex flex-wrap gap-2">
                  {selectedAvisHospit.Isolement && <span className="d-inline-flex align-items-center px-2 py-1 rounded-pill bg-warning bg-opacity-10 text-warning small fw-semibold">Isolement</span>}
                  {selectedAvisHospit.HospitAnt && <span className="d-inline-flex align-items-center px-2 py-1 rounded-pill bg-info bg-opacity-10 text-info small fw-semibold">Hospit. Ant.</span>}
                  {selectedAvisHospit.sejourunjour && <span className="d-inline-flex align-items-center px-2 py-1 rounded-pill bg-secondary bg-opacity-10 text-secondary small fw-semibold">Séjour Jour</span>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted">Aucune observation sélectionnée</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAvisModal(false)}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>

    {selectedExamenHospit && (
      <HospitalisationsPatientModal
        show={showExamenHospitModal}
        onHide={() => setShowExamenHospitModal(false)}
        patientId={patientId}
        patientNom={patientNom}
        patientPrenoms={patientPrenoms}
        initialHospitalisationId={selectedExamenHospit._id}
      />
    )}
  </>);
}
