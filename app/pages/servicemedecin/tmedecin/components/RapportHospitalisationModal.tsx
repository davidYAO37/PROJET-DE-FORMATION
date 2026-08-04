'use client';
import { useState, useEffect, FormEvent } from 'react';
import { Modal, Card, Row, Col, Table, Button, Form, Alert, Badge } from 'react-bootstrap';
import { FaHospitalUser, FaPrint, FaSave, FaPlus, FaEdit, FaTrash, FaFileAlt, FaSyncAlt } from 'react-icons/fa';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from '@/utils/printRecu';
import { RapportHospitalisationForm, ServiceHospitalisation } from '@/types/rapportHospitalisation';

interface RapportHospitalisation extends RapportHospitalisationForm {
  _id: string;
  dateCreation: Date;
  dureeHospitalisation?: number;
}

interface RapportHospitalisationModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
}

const SERVICE_LABELS: Record<ServiceHospitalisation | string, string> = {
  MED: 'Médecine',
  CHIR: 'Chirurgie',
  'CHR.SP': 'Chirurgie Spécialisée',
  OBST: 'Obstétrique',
  GYN: 'Gynécologie',
  PED: 'Pédiatrie',
  REA: 'Réanimation',
  URG: 'Urgences',
};

const formatDateInput = (value: string | Date | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function RapportHospitalisationModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
}: RapportHospitalisationModalProps) {
  const [rapports, setRapports] = useState<RapportHospitalisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRapport, setEditingRapport] = useState<RapportHospitalisation | null>(null);
  const [loadingHospitData, setLoadingHospitData] = useState(false);
  const [hospitDataError, setHospitDataError] = useState('');
  const [typeActes, setTypeActes] = useState<{ _id: string; Designation: string }[]>([]);

  const currentUser = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || ''
    : '';

  const { entreprise } = useEntreprise();

  const [formData, setFormData] = useState<RapportHospitalisationForm>({
    patientId,
    hospitalisationId: undefined,
    patientNom,
    patientPrenoms,
    dateEntree: new Date(),
    dateSortie: new Date(),
    service: '',
    motifHospitalisation: '',
    diagnosticAdmission: '',
    diagnosticFinal: '',
    histoireMaladie: '',
    examenClinique: '',
    examensParacliniques: '',
    traitementAdministre: '',
    evolution: '',
    complications: '',
    suitesHospitalisation: '',
    medecinTraitant: '',
    medecinChefService: '',
    recommandations: '',
    dateRapport: new Date(),
  });

  const loadRapports = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/rapportHospitalisation?patientId=${patientId}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Impossible de charger les rapports');
      }

      const data = await response.json();
      setRapports(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des rapports');
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTypeActes = async () => {
    try {
      const response = await fetch('/api/typeacte/hospitalisation');
      if (!response.ok) return;
      const data = await response.json();
      setTypeActes(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des types d\'actes:', err);
    }
  };

  useEffect(() => {
    if (show && patientId) {
      loadRapports();
      loadTypeActes();
    }
  }, [show, patientId]);

  const resetForm = () => {
    setFormData({
      patientId,
      hospitalisationId: undefined,
      patientNom,
      patientPrenoms,
      dateEntree: new Date(),
      dateSortie: new Date(),
      service: '',
      motifHospitalisation: '',
      diagnosticAdmission: '',
      diagnosticFinal: '',
      histoireMaladie: '',
      examenClinique: '',
      examensParacliniques: '',
      traitementAdministre: '',
      evolution: '',
      complications: '',
      suitesHospitalisation: '',
      medecinTraitant: '',
      medecinChefService: '',
      recommandations: '',
      dateRapport: new Date(),
    });
    setEditingRapport(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleEdit = async (rapport: RapportHospitalisation) => {
    const freshRapport = await getFreshRapport(rapport);
    setFormData({
      patientId: freshRapport.patientId,
      hospitalisationId: freshRapport.hospitalisationId,
      patientNom: freshRapport.patientNom,
      patientPrenoms: freshRapport.patientPrenoms,
      dateEntree: new Date(freshRapport.dateEntree),
      dateSortie: freshRapport.dateSortie ? new Date(freshRapport.dateSortie) : undefined,
      service: freshRapport.service || '',
      motifHospitalisation: freshRapport.motifHospitalisation || '',
      diagnosticAdmission: freshRapport.diagnosticAdmission || '',
      diagnosticFinal: freshRapport.diagnosticFinal || '',
      histoireMaladie: freshRapport.histoireMaladie || '',
      examenClinique: freshRapport.examenClinique || '',
      examensParacliniques: freshRapport.examensParacliniques || '',
      traitementAdministre: freshRapport.traitementAdministre || '',
      evolution: freshRapport.evolution || '',
      complications: freshRapport.complications || '',
      suitesHospitalisation: freshRapport.suitesHospitalisation || '',
      medecinTraitant: freshRapport.medecinTraitant || '',
      medecinChefService: freshRapport.medecinChefService || '',
      recommandations: freshRapport.recommandations || '',
      dateRapport: new Date(freshRapport.dateRapport),
      statut: freshRapport.statut,
    });
    setEditingRapport(freshRapport);
    setShowFormModal(true);
  };

  const chargerDonneesHospitalisation = async () => {
    setLoadingHospitData(true);
    setHospitDataError('');

    try {
      const response = await fetch(`/api/rapportHospitalisation/donnees?patientId=${patientId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Impossible de récupérer les données de l\'hospitalisation');
      }

      const {
        examenHospitalisation,
        evolutions,
        consultation,
        lignesConsultation,
        prescriptionsConsultation,
      } = result.data;

      // Mêmes sources et format que PrintFichePrescription : ExamenClinique est le
      // texte saisi par le médecin à la consultation, les examens paracliniques sont
      // les LignePrestation de la consultation filtrées par lettreCle, et le
      // traitement liste les PatientPrescription de la consultation.
      const examenCliniqueText = consultation?.ExamenClinique || '';

      const examensParacliniques = (lignesConsultation || []).filter(
        (ligne: any) => !!ligne.lettreCle && ['K', 'KC', 'B', 'Z', 'D'].includes(ligne.lettreCle)
      );
      const examensParacliniquesText = examensParacliniques
        .sort((a: any, b: any) => (a.ordonnancementAffichage || 0) - (b.ordonnancementAffichage || 0))
        .map((l: any) => l.prestation)
        .join(' - ');

      const traitementAdministreText = (prescriptionsConsultation || [])
        .map((p: any) => `- ${p.nomMedicament} ${p.posologie || ''} qté:${p.QteP}`)
        .join('\n');

      const evolutionText = evolutions
        .map((e: any) => {
          const date = e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '';
          return `- ${date} ${e.heure || ''} : ${e.observation}${e.decision ? ` — Décision : ${e.decision}` : ''}${e.etatPatient ? ` — État : ${e.etatPatient}` : ''}`;
        })
        .join('\n');

      setFormData((prev) => ({
        ...prev,
        hospitalisationId: examenHospitalisation._id ? String(examenHospitalisation._id) : prev.hospitalisationId,
        dateEntree: examenHospitalisation.Entrele ? new Date(examenHospitalisation.Entrele) : prev.dateEntree,
        dateSortie: examenHospitalisation.SortieLe ? new Date(examenHospitalisation.SortieLe) : prev.dateSortie,
        service: examenHospitalisation.Designationtypeacte || prev.service,
        medecinTraitant: examenHospitalisation.NomMed || prev.medecinTraitant,
        diagnosticAdmission: examenHospitalisation.Rclinique || prev.diagnosticAdmission,
        motifHospitalisation: examenHospitalisation.motifHospitalisation || examenHospitalisation.Rclinique || prev.motifHospitalisation,
        examenClinique: examenCliniqueText || prev.examenClinique,
        examensParacliniques: examensParacliniquesText || prev.examensParacliniques,
        traitementAdministre: traitementAdministreText || prev.traitementAdministre,
        evolution: evolutionText || prev.evolution,
      }));
    } catch (err: any) {
      setHospitDataError(err.message || 'Erreur lors du chargement des données de l\'hospitalisation');
      setTimeout(() => setHospitDataError(''), 5000);
    } finally {
      setLoadingHospitData(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editingRapport
        ? `/api/rapportHospitalisation/${editingRapport._id}`
        : '/api/rapportHospitalisation';
      const method = editingRapport ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        patientId,
        patientNom,
        patientPrenoms,
        dateRapport: formData.dateRapport || new Date(),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': currentUser,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }

      setSuccess(result.message || (editingRapport ? 'Rapport modifié avec succès' : 'Rapport créé avec succès'));
      setTimeout(() => setSuccess(''), 3000);
      setShowFormModal(false);
      resetForm();
      await loadRapports();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rapportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport d\'hospitalisation ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rapportHospitalisation/${rapportId}`, {
        method: 'DELETE',
        headers: {
          'x-user-name': currentUser,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      setSuccess(result.message || 'Rapport supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
      setRapports((prev) => prev.filter((rapport) => rapport._id !== rapportId));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getServiceLabel = (service: ServiceHospitalisation | string | undefined) => {
    if (!service) return 'N/A';
    return SERVICE_LABELS[service] || service;
  };

  const getStatutBadge = (statut: string | undefined) => {
    if (statut === 'valide') return <Badge bg="success">Validé</Badge>;
    if (statut === 'a_completer') return <Badge bg="warning" text="dark">À compléter</Badge>;
    return <Badge bg="secondary">Brouillon</Badge>;
  };

  const getReportPrintContent = (rapport: RapportHospitalisation) => {
    const patientFullName = `${rapport.patientNom || ''} ${rapport.patientPrenoms || ''}`.trim() || 'Patient non renseigné';
    const dateEntree = new Date(rapport.dateEntree).toLocaleDateString('fr-FR');
    const dateSortie = rapport.dateSortie ? new Date(rapport.dateSortie).toLocaleDateString('fr-FR') : 'N/A';
    const dureeHospitalisation = rapport.dureeHospitalisation
      ? `${rapport.dureeHospitalisation} jour${rapport.dureeHospitalisation > 1 ? 's' : ''}`
      : 'N/A';
    const numeroRapport = rapport._id || 'N/A';
    const utilisateur = typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || '' : '';

    const section = (title: string, content: string | undefined) => `
        <div style="margin-bottom: 18px;">
          <div style="background-color: #d3d3d3; padding: 6px 10px; font-weight: bold; font-size: 13px; color: #000000; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            ${title}
          </div>
          <div style="padding: 8px 10px; font-size: 12px; white-space: pre-line;">${content || 'Non spécifié'}</div>
        </div>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport d'Hospitalisation</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 10px; font-size: 12px; color: #000000; line-height: 1.3; }
          @media print { body { font-size: 11px; } }
        </style>
      </head>
      <body>
        <div style="background-color: #d3d3d3; padding: 10px; text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 18px; color: #000000; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          RAPPORT D'HOSPITALISATION N° ${numeroRapport}
        </div>

        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 16px;">${patientFullName}</div>
            <div style="display: flex; gap: 25px; font-size: 12px;">
              <div><strong>Service :</strong> ${getServiceLabel(rapport.service)}</div>
              <div><strong>Médecin traitant :</strong> ${rapport.medecinTraitant || 'N/A'}</div>
              <div><strong>Chef de service :</strong> ${rapport.medecinChefService || 'N/A'}</div>
            </div>
          </div>
          <div style="display: flex; gap: 25px; font-size: 12px;">
            <div><strong>Entrée le :</strong> ${dateEntree}</div>
            <div><strong>Sortie le :</strong> ${dateSortie}</div>
            <div><strong>Durée :</strong> ${dureeHospitalisation}</div>
          </div>
        </div>

        ${section('MOTIF D\'HOSPITALISATION', rapport.motifHospitalisation)}
        <div style="display: flex; gap: 15px;">
          <div style="flex: 1;">${section('DIAGNOSTIC D\'ADMISSION', rapport.diagnosticAdmission)}</div>
          <div style="flex: 1;">${section('DIAGNOSTIC FINAL', rapport.diagnosticFinal)}</div>
        </div>
        ${section('HISTOIRE DE LA MALADIE', rapport.histoireMaladie)}
        ${section('EXAMEN CLINIQUE', rapport.examenClinique)}
        ${section('EXAMENS PARACLINIQUES', rapport.examensParacliniques)}
        ${section('TRAITEMENT ADMINISTRÉ', rapport.traitementAdministre)}
        ${section('ÉVOLUTION', rapport.evolution)}
        ${rapport.complications ? section('COMPLICATIONS', rapport.complications) : ''}
        ${section('SUITES D\'HOSPITALISATION', rapport.suitesHospitalisation)}
        ${section('RECOMMANDATIONS', rapport.recommandations)}

        <div style="text-align: right; font-size: 12px; margin-top: 15px;">
          Cordialement, ${rapport.medecinTraitant || 'N/A'}
        </div>

        <div style="text-align: center; font-size: 10px; color: #666666; margin-top: 20px;">
          Imprimé le: ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par ${utilisateur}
        </div>
      </body>
      </html>
    `;
  };

  const getFreshRapport = async (rapport: RapportHospitalisation): Promise<RapportHospitalisation> => {
    if (!rapport._id) return rapport;
    try {
      const response = await fetch(`/api/rapportHospitalisation/${rapport._id}`);
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        return result.data;
      }
    } catch (err) {
      console.error('Erreur lors du rechargement du rapport avant impression:', err);
    }
    return rapport;
  };

  const handlePrintWithHeader = async (rapport: RapportHospitalisation) => {
    const freshRapport = await getFreshRapport(rapport);
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    // Extraire juste le contenu du body sans le wrapper HTML
    const fullHTML = getReportPrintContent(freshRapport);
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/);
    const contentHTML = bodyMatch ? bodyMatch[1] : fullHTML;
    createPrintWindow('Rapport d\'Hospitalisation', headerHTML, contentHTML, footerHTML);
  };

  const handlePrintWithoutHeader = async (rapport: RapportHospitalisation) => {
    const freshRapport = await getFreshRapport(rapport);
    const fullHTML = getReportPrintContent(freshRapport);
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/);
    const contentHTML = bodyMatch ? bodyMatch[1] : fullHTML;
    createPrintWindowWithoutHeader('Rapport d\'Hospitalisation', contentHTML);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaHospitalUser className="me-2" />
            Gestion des Rapports d'Hospitalisation
            <Badge bg="light" text="dark" className="ms-2">{rapports.length}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="fw-bold">Patient :</div>
              <div>{patientNom} {patientPrenoms}</div>
            </div>
            <Button variant="primary" onClick={handleAdd}>
              <FaPlus className="me-2" />
              Nouveau rapport
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : rapports.length > 0 ? (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Date entrée</th>
                  <th>Date sortie</th>
                  <th>Service</th>
                  <th>Médecin traitant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rapports.map((rapport) => {
                  const isValide = rapport.statut === 'valide';
                  return (
                  <tr key={rapport._id}>
                    <td>{formatDateInput(rapport.dateEntree)}</td>
                    <td>{formatDateInput(rapport.dateSortie)}</td>
                    <td>{getServiceLabel(rapport.service)}</td>
                    <td>{rapport.medecinTraitant}</td>
                    <td>{getStatutBadge(rapport.statut)}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(rapport)} title={isValide ? 'Consulter (lecture seule)' : 'Modifier'}>
                          <FaEdit />
                        </Button>
                        <Button variant="outline-success" size="sm" onClick={() => handlePrintWithHeader(rapport)}>
                          <FaPrint />
                        </Button>
                        <Button variant="outline-info" size="sm" onClick={() => handlePrintWithoutHeader(rapport)}>
                          <FaFileAlt />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(rapport._id)} disabled={isValide} title={isValide ? 'Rapport validé : suppression impossible' : 'Supprimer'}>
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">Aucun rapport d'hospitalisation trouvé</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Fermer</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="xl">
        <Modal.Header
          closeButton
          closeVariant="white"
          className="text-white border-0"
          style={{ background: 'linear-gradient(135deg, #198754, #146c43)' }}
        >
          <Modal.Title className="d-flex align-items-center gap-2 flex-grow-1">
            <FaHospitalUser />
            <span>{editingRapport ? 'Modifier le rapport d\'hospitalisation' : 'Nouveau rapport d\'hospitalisation'}</span>
            {getStatutBadge(formData.statut)}
          </Modal.Title>
          <Button
            variant="light"
            size="sm"
            onClick={chargerDonneesHospitalisation}
            disabled={loadingHospitData || formData.statut === 'valide'}
            className="me-3 fw-semibold"
          >
            <FaSyncAlt className={`me-2 ${loadingHospitData ? 'fa-spin' : ''}`} />
            {loadingHospitData ? 'Chargement...' : 'Charger les données'}
          </Button>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {formData.statut === 'valide' && (
            <Alert variant="success" className="d-flex align-items-center gap-2">
              <FaHospitalUser /> Ce rapport est validé : il est en lecture seule et ne sera plus actualisé automatiquement.
            </Alert>
          )}
          {hospitDataError && <Alert variant="warning" className="py-2">{hospitDataError}</Alert>}
          <Form onSubmit={handleSave}>
          <fieldset disabled={formData.statut === 'valide'}>
            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Informations Générales</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date d'entrée *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formatDateInput(formData.dateEntree)}
                        onChange={(e) => setFormData({ ...formData, dateEntree: new Date(e.target.value) })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date de sortie *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formatDateInput(formData.dateSortie)}
                        onChange={(e) => setFormData({ ...formData, dateSortie: new Date(e.target.value) })}
                        min={formatDateInput(formData.dateEntree)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Service *</Form.Label>
                      <Form.Select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        required
                      >
                        <option value="">Sélectionner...</option>
                        {typeActes.map((typeActe) => (
                          <option key={typeActe._id} value={typeActe.Designation}>{typeActe.Designation}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Médecin traitant *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.medecinTraitant}
                        onChange={(e) => setFormData({ ...formData, medecinTraitant: e.target.value })}
                        placeholder="Nom du médecin traitant"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Médecin chef de service</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.medecinChefService}
                        onChange={(e) => setFormData({ ...formData, medecinChefService: e.target.value })}
                        placeholder="Nom du chef de service"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Diagnostic et Motif</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Motif d'hospitalisation *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.motifHospitalisation}
                    onChange={(e) => setFormData({ ...formData, motifHospitalisation: e.target.value })}
                    placeholder="Motif principal de l'hospitalisation..."
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Diagnostic d'admission *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.diagnosticAdmission}
                        onChange={(e) => setFormData({ ...formData, diagnosticAdmission: e.target.value })}
                        placeholder="Diagnostic à l'admission..."
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Diagnostic final *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.diagnosticFinal}
                        onChange={(e) => setFormData({ ...formData, diagnosticFinal: e.target.value })}
                        placeholder="Diagnostic final..."
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Évolution Clinique</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Histoire de la maladie *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.histoireMaladie}
                    onChange={(e) => setFormData({ ...formData, histoireMaladie: e.target.value })}
                    placeholder="Historique détaillé de la maladie..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Examen clinique *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.examenClinique}
                    onChange={(e) => setFormData({ ...formData, examenClinique: e.target.value })}
                    placeholder="Résultats de l'examen clinique..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Examens paracliniques</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.examensParacliniques}
                    onChange={(e) => setFormData({ ...formData, examensParacliniques: e.target.value })}
                    placeholder="Résultats des examens complémentaires..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Traitement et Évolution</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Traitement administré *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.traitementAdministre}
                    onChange={(e) => setFormData({ ...formData, traitementAdministre: e.target.value })}
                    placeholder="Traitements administrés pendant l'hospitalisation..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Évolution *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.evolution}
                    onChange={(e) => setFormData({ ...formData, evolution: e.target.value })}
                    placeholder="Évolution du patient pendant l'hospitalisation..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Complications</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.complications}
                    onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                    placeholder="Complications éventuelles survenues..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Suites et Recommandations</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Suites d'hospitalisation *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.suitesHospitalisation}
                    onChange={(e) => setFormData({ ...formData, suitesHospitalisation: e.target.value })}
                    placeholder="Description des suites de l'hospitalisation..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Recommandations *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.recommandations}
                    onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
                    placeholder="Recommandations pour le suivi..."
                    required
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Statut du rapport</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label>Statut</Form.Label>
                  <Form.Select
                    value={formData.statut || 'brouillon'}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as typeof formData.statut })}
                  >
                    <option value="brouillon">Brouillon (actualisation automatique)</option>
                    <option value="a_completer">À compléter</option>
                    <option value="valide">Validé (verrouille définitivement le rapport)</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Tant que le statut n'est pas "Validé", le rapport est actualisé automatiquement à chaque nouvelle prescription, soin, constante ou évolution. Une fois validé, il ne peut plus être actualisé, modifié ni supprimé.
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </fieldset>

            <div className="d-flex justify-content-between">
              <Button variant="outline-success" onClick={() => handlePrintWithHeader(editingRapport ? editingRapport : formData as RapportHospitalisation)}>
                <FaPrint className="me-2" />
                Aperçu Impression (avec entête)
              </Button>
              <Button variant="outline-info" onClick={() => handlePrintWithoutHeader(editingRapport ? editingRapport : formData as RapportHospitalisation)}>
                <FaFileAlt className="me-2" />
                Aperçu Impression (sans entête)
              </Button>
              <div>
                <Button variant="secondary" className="me-2" onClick={() => setShowFormModal(false)}>
                  Annuler
                </Button>
                <Button variant="success" type="submit" disabled={saving || formData.statut === 'valide'}>
                  <FaSave className="me-2" />
                  {saving ? 'Sauvegarde...' : (editingRapport ? 'Modifier' : 'Créer')}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
