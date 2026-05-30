'use client';
import { useState, useEffect, FormEvent } from 'react';
import { Modal, Card, Row, Col, Table, Button, Form, Alert, Badge } from 'react-bootstrap';
import { FaHospitalUser, FaPrint, FaSave, FaPlus, FaEdit, FaTrash, FaFileAlt } from 'react-icons/fa';
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

const formatDateInput = (value: string | Date) => {
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

  const currentUser = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || ''
    : '';

  const { entreprise } = useEntreprise();

  const [formData, setFormData] = useState<RapportHospitalisationForm>({
    patientId,
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

  useEffect(() => {
    if (show && patientId) {
      loadRapports();
    }
  }, [show, patientId]);

  const resetForm = () => {
    setFormData({
      patientId,
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

  const handleEdit = (rapport: RapportHospitalisation) => {
    setFormData({
      patientId: rapport.patientId,
      patientNom: rapport.patientNom,
      patientPrenoms: rapport.patientPrenoms,
      dateEntree: new Date(rapport.dateEntree),
      dateSortie: new Date(rapport.dateSortie),
      service: rapport.service,
      motifHospitalisation: rapport.motifHospitalisation,
      diagnosticAdmission: rapport.diagnosticAdmission,
      diagnosticFinal: rapport.diagnosticFinal,
      histoireMaladie: rapport.histoireMaladie,
      examenClinique: rapport.examenClinique,
      examensParacliniques: rapport.examensParacliniques || '',
      traitementAdministre: rapport.traitementAdministre,
      evolution: rapport.evolution,
      complications: rapport.complications || '',
      suitesHospitalisation: rapport.suitesHospitalisation,
      medecinTraitant: rapport.medecinTraitant,
      medecinChefService: rapport.medecinChefService || '',
      recommandations: rapport.recommandations,
      dateRapport: new Date(rapport.dateRapport),
    });
    setEditingRapport(rapport);
    setShowFormModal(true);
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

  const getServiceLabel = (service: ServiceHospitalisation | string) => {
    return SERVICE_LABELS[service] || service || 'N/A';
  };

  const getReportPrintContent = (rapport: RapportHospitalisationForm | RapportHospitalisation) => {
    const patientFullName = `${rapport.patientNom || ''} ${rapport.patientPrenoms || ''}`.trim() || 'Patient non renseigné';
    const dateEntree = new Date(rapport.dateEntree).toLocaleDateString('fr-FR');
    const dateSortie = new Date(rapport.dateSortie).toLocaleDateString('fr-FR');
    const dateRapport = new Date(rapport.dateRapport).toLocaleDateString('fr-FR');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport d'Hospitalisation</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #000; }
          .header { text-align: center; border-bottom: 3px double #007bff; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-item { display: flex; }
          .info-label { font-weight: bold; width: 160px; }
          .footer { text-align: center; margin-top: 50px; font-style: italic; }
          @media print { body { font-size: 11px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>RAPPORT D'HOSPITALISATION</h2>
          <p>Patient: ${patientFullName}</p>
          <p>Service: ${getServiceLabel(rapport.service)}</p>
        </div>

        <div class="info-grid">
          <div class="info-item"><span class="info-label">Date d'entrée :</span><span>${dateEntree}</span></div>
          <div class="info-item"><span class="info-label">Date de sortie :</span><span>${dateSortie}</span></div>
          <div class="info-item"><span class="info-label">Médecin traitant :</span><span>${rapport.medecinTraitant || 'N/A'}</span></div>
          <div class="info-item"><span class="info-label">Chef de service :</span><span>${rapport.medecinChefService || 'N/A'}</span></div>
          <div class="info-item"><span class="info-label">Date du rapport :</span><span>${dateRapport}</span></div>
        </div>

        <div class="section"><div class="section-title">MOTIF D'HOSPITALISATION</div><p>${rapport.motifHospitalisation || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">HISTOIRE DE LA MALADIE</div><p style="white-space: pre-line;">${rapport.histoireMaladie || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">EXAMEN CLINIQUE</div><p style="white-space: pre-line;">${rapport.examenClinique || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">EXAMENS PARACLINIQUES</div><p style="white-space: pre-line;">${rapport.examensParacliniques || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">DIAGNOSTIC D'ADMISSION</div><p>${rapport.diagnosticAdmission || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">DIAGNOSTIC FINAL</div><p>${rapport.diagnosticFinal || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">TRAITEMENT ADMINISTRÉ</div><p style="white-space: pre-line;">${rapport.traitementAdministre || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">ÉVOLUTION</div><p style="white-space: pre-line;">${rapport.evolution || 'Non spécifié'}</p></div>
        ${rapport.complications ? `<div class="section"><div class="section-title">COMPLICATIONS</div><p style="white-space: pre-line;">${rapport.complications}</p></div>` : ''}
        <div class="section"><div class="section-title">SUITES D'HOSPITALISATION</div><p style="white-space: pre-line;">${rapport.suitesHospitalisation || 'Non spécifié'}</p></div>
        <div class="section"><div class="section-title">RECOMMANDATIONS</div><p style="white-space: pre-line;">${rapport.recommandations || 'Non spécifié'}</p></div>

        <div class="footer"><p>Fait le ${new Date().toLocaleDateString('fr-FR')}</p><p>Document généré par le système de gestion médicale</p></div>
      </body>
      </html>
    `;
  };

  const handlePrintWithHeader = (rapport: RapportHospitalisation) => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    // Extraire juste le contenu du body sans le wrapper HTML
    const fullHTML = getReportPrintContent(rapport);
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/);
    const contentHTML = bodyMatch ? bodyMatch[1] : fullHTML;
    createPrintWindow('Rapport d\'Hospitalisation', headerHTML, contentHTML, footerHTML);
  };

  const handlePrintWithoutHeader = (rapport: RapportHospitalisation) => {
    const fullHTML = getReportPrintContent(rapport);
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rapports.map((rapport) => (
                  <tr key={rapport._id}>
                    <td>{formatDateInput(rapport.dateEntree)}</td>
                    <td>{formatDateInput(rapport.dateSortie)}</td>
                    <td>{getServiceLabel(rapport.service)}</td>
                    <td>{rapport.medecinTraitant}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(rapport)}>
                          <FaEdit />
                        </Button>
                        <Button variant="outline-success" size="sm" onClick={() => handlePrintWithHeader(rapport)}>
                          <FaPrint />
                        </Button>
                        <Button variant="outline-info" size="sm" onClick={() => handlePrintWithoutHeader(rapport)}>
                          <FaFileAlt />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(rapport._id)}>
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRapport ? 'Modifier le rapport d\'hospitalisation' : 'Nouveau rapport d\'hospitalisation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Form onSubmit={handleSave}>
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
                        <option value="MED">Médecine</option>
                        <option value="CHIR">Chirurgie</option>
                        <option value="CHR.SP">Chirurgie Spécialisée</option>
                        <option value="OBST">Obstétrique</option>
                        <option value="GYN">Gynécologie</option>
                        <option value="PED">Pédiatrie</option>
                        <option value="REA">Réanimation</option>
                        <option value="URG">Urgences</option>
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
                <Button variant="success" type="submit" disabled={saving}>
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
