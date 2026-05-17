'use client';
import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaHospital, FaUserMd, FaCalendarAlt, FaClock, FaNotesMedical, FaPrint, FaFileAlt } from 'react-icons/fa';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from '@/utils/printRecu';


interface AvisHospitModalProps {
  show: boolean;
  onHide: () => void;
  consultationId?: string;
  patientId?: string;
  patientNom?: string;
  patientPrenoms?: string;
  Code_dossier?: string;
  Assurance?: string
  SOCIETE_PATIENT?: string;

}

interface AvisHospit {
  _id?: string;
  serviceHospit: string;
  etatPatient: string;
  DureHospit: string;
  Patient: string;
  DateIntervention: string;
  HeureHospit: string;
  NumDoc: string;
  MedecinTraitant: string;
  Diagnostic: string;
  DatePrevue: string;
  assurance?: string;
  SocieteP?: string;
  Isolement?: boolean;
  HospitAnt?: boolean;
  sejourunjour?: boolean;
}

const services = [
  { value: 'MED', label: 'Médecine', color: 'primary' },
  { value: 'CHIR', label: 'Chirurgie', color: 'danger' },
  { value: 'CHR.SP', label: 'Chirurgie Spécialisée', color: 'warning' },
  { value: 'OBST', label: 'Obstétrique', color: 'info' },
  { value: 'GYN', label: 'Gynécologie', color: 'success' },
  { value: 'PED', label: 'Pédiatrie', color: 'secondary' }
];

const etatsPatient = [
  { value: 'Urgent', label: 'Urgent', color: 'danger' },
  { value: 'Semi-Urgent', label: 'Semi-Urgent', color: 'warning' },
  { value: 'Electif', label: 'Électif', color: 'info' }
];

export default function AvisHospitModal({
  show,
  onHide,
  consultationId,
  patientId,
  patientNom,
  patientPrenoms,
  Code_dossier,
  Assurance,
  SOCIETE_PATIENT
}: AvisHospitModalProps) {
  const [avisList, setAvisList] = useState<AvisHospit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAvis, setEditingAvis] = useState<AvisHospit | null>(null);

  const Utilisateur = typeof window !== "undefined" ? localStorage.getItem("nom_utilisateur") : "";

  // Formulaire
  const [formData, setFormData] = useState<AvisHospit>({
    serviceHospit: 'MED',
    etatPatient: 'Electif',
    DureHospit: '',
    Patient: patientNom && patientPrenoms ? `${patientNom} ${patientPrenoms}` : '',
    DateIntervention: '',
    HeureHospit: '',
    NumDoc: Code_dossier || '',
    MedecinTraitant: Utilisateur || '',
    Diagnostic: '',
    DatePrevue: '',
    assurance: Assurance || '',
    SocieteP: SOCIETE_PATIENT || '',
    Isolement: false,
    HospitAnt: false,
    sejourunjour: false
  });

  // Charger la liste des avis
  const loadAvis = async () => {
    if (!consultationId && !patientId) return;
    if (!patientId && !consultationId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (consultationId) params.append('consultationId', consultationId);
      if (patientId) params.append('patientId', patientId);

      const response = await fetch(`/api/avishospit?${params}`);
      const data = await response.json();

      if (data.success) {
        setAvisList(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement des avis');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!show) return;

      await loadAvis();

      if (mounted) {
        setFormData(prev => ({
          ...prev,
          Patient:
            patientNom && patientPrenoms
              ? `${patientNom} ${patientPrenoms}`
              : '',
          NumDoc: Code_dossier || '',
          assurance: Assurance || '',
          SocieteP: SOCIETE_PATIENT || ''
        }));
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [
    show, consultationId, patientId, patientNom, patientPrenoms, Code_dossier, Assurance, SOCIETE_PATIENT
  ]);
  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      serviceHospit: 'MED',
      etatPatient: 'Electif',
      DureHospit: '',
      Patient: patientNom && patientPrenoms ? `${patientNom} ${patientPrenoms}` : '',
      DateIntervention: '',
      HeureHospit: '',
      NumDoc: Code_dossier || '',
      MedecinTraitant: Utilisateur || '',
      Diagnostic: '',
      DatePrevue: '',
      assurance: Assurance || '',
      SocieteP: SOCIETE_PATIENT || '',
      Isolement: false,
      HospitAnt: false,
      sejourunjour: false
    });
    setEditingAvis(null);
    setError('');
    setSuccess('');
  };

  // Gérer le changement du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Sauvegarder l'avis
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = editingAvis ? '/api/avishospit' : '/api/avishospit';
      const method = editingAvis ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        IDPARTIENT: patientId,
        IDCONSULTATION: consultationId,
        ...(editingAvis && { _id: editingAvis._id })
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        resetForm();
        setShowForm(false);
        loadAvis();
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Modifier un avis
  const handleEdit = (avis: AvisHospit) => {
    setEditingAvis(avis);
    setFormData({
      ...avis,
      DateIntervention: new Date(avis.DateIntervention).toISOString().split('T')[0],
      DatePrevue: new Date(avis.DatePrevue).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  // Supprimer un avis
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis d\'hospitalisation ?')) return;

    try {
      const response = await fetch(`/api/avishospit?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Avis supprimé avec succès');
        loadAvis();
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const getServiceInfo = (service: string) => {
    return services.find(s => s.value === service) || services[0];
  };

  const getEtatInfo = (etat: string) => {
    return etatsPatient.find(e => e.value === etat) || etatsPatient[0];
  };


  // Impression
  const { entreprise } = useEntreprise();


  const getAvisHospitPrintContent = (avis: AvisHospit) => {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Avis d'Hospitalisation</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          .section-title { font-weight: bold; margin-top: 18px; margin-bottom: 8px; font-size: 1.1rem; }
          .info { margin-bottom: 6px; }
          .footer { margin-top: 24px; font-size: 12px; color: #888; text-align: right; }
        </style>
      </head>
      <body>
        <div style="text-align:center; font-size:1.3rem; font-weight:bold; margin-bottom:18px;">AVIS D'HOSPITALISATION</div>
        <div class="info"><strong>Patient :</strong> ${avis.Patient || ''}</div>
        <div class="info"><strong>Diagnostic :</strong> ${avis.Diagnostic || ''}</div>
        <div class="info"><strong>Service :</strong> ${getServiceInfo(avis.serviceHospit).label}</div>
        <div class="info"><strong>État du patient :</strong> ${getEtatInfo(avis.etatPatient).label}</div>
        <div class="info"><strong>Durée probable :</strong> ${avis.DureHospit || ''}</div>
        <div class="info"><strong>Date d'intervention :</strong> ${avis.DateIntervention ? new Date(avis.DateIntervention).toLocaleDateString() : ''}</div>
        <div class="info"><strong>Heure :</strong> ${avis.HeureHospit || ''}</div>
        <div class="info"><strong>Date prévue :</strong> ${avis.DatePrevue ? new Date(avis.DatePrevue).toLocaleDateString() : ''}</div>
        <div class="info"><strong>Médecin traitant :</strong> ${avis.MedecinTraitant || ''}</div>
        <div class="info"><strong>Numéro de document :</strong> ${avis.NumDoc || ''}</div>
        <div class="info"><strong>Assurance :</strong> ${avis.assurance || ''}</div>
        <div class="info"><strong>Société patient :</strong> ${avis.SocieteP || ''}</div>
        ${avis.Isolement ? '<div class="info"><strong>Isolement requis</strong></div>' : ''}
        ${avis.HospitAnt ? '<div class="info"><strong>Déjà hospitalisé(e)</strong></div>' : ''}
        ${avis.sejourunjour ? '<div class="info"><strong>Séjour d\'un jour</strong></div>' : ''}
        <div class="footer">Fait le ${new Date().toLocaleDateString('fr-FR')}</div>
      </body>
      </html>
    `;
  };

  const handlePrintWithHeader = (avis: AvisHospit) => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    const fullHTML = getAvisHospitPrintContent(avis);
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/);
    const contentHTML = bodyMatch ? bodyMatch[1] : fullHTML;
    createPrintWindow("Avis d'Hospitalisation", headerHTML, contentHTML, footerHTML);
  };

  const handlePrintWithoutHeader = (avis: AvisHospit) => {
    const fullHTML = getAvisHospitPrintContent(avis);
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/);
    const contentHTML = bodyMatch ? bodyMatch[1] : fullHTML;
    createPrintWindowWithoutHeader("Avis d'Hospitalisation", contentHTML);
  };


  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaHospital className="me-2" />
          Avis d'Hospitalisation
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

        {!showForm ? (
          <>
            {/* Liste des avis */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <FaNotesMedical className="me-2" />
                Liste des avis d'hospitalisation
              </h5>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <i className="bi bi-plus-circle me-2"></i>
                Nouvel avis
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : avisList.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FaHospital size={48} className="mb-3" />
                <p>Aucun avis d'hospitalisation enregistré</p>
              </div>
            ) : (
              <Row className="g-3">
                {avisList.map((avis, idx) => {
                  const serviceInfo = getServiceInfo(avis.serviceHospit);
                  const etatInfo = getEtatInfo(avis.etatPatient);

                  return (
                    <Col md={6} key={avis._id || `avis-${idx}`}>
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <span
                                className="me-2 d-inline-block text-white px-2 py-1 rounded"
                                style={{
                                  fontSize: '0.65rem',
                                  backgroundColor: serviceInfo.color === 'primary' ? '#0d6efd' :
                                    serviceInfo.color === 'danger' ? '#dc3545' :
                                      serviceInfo.color === 'warning' ? '#ffc107' :
                                        serviceInfo.color === 'info' ? '#0dcaf0' :
                                          serviceInfo.color === 'success' ? '#198754' : '#6c757d'
                                }}
                              >
                                {serviceInfo.label}
                              </span>
                              <span
                                className="me-2 d-inline-block text-white px-2 py-1 rounded"
                                style={{
                                  fontSize: '0.65rem',
                                  backgroundColor: etatInfo.color === 'primary' ? '#0d6efd' :
                                    etatInfo.color === 'danger' ? '#dc3545' :
                                      etatInfo.color === 'warning' ? '#ffc107' :
                                        etatInfo.color === 'info' ? '#0dcaf0' :
                                          etatInfo.color === 'success' ? '#198754' : '#6c757d'
                                }}
                              >
                                {etatInfo.label}
                              </span>
                            </div>
                            <div className="btn-group btn-group-sm">
                              <Button variant="outline-primary" size="sm" onClick={() => handleEdit(avis)}>
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button variant="outline-success" size="sm" onClick={() => handlePrintWithHeader(avis)} title="Imprimer avec en-tête">
                                <FaPrint />
                              </Button>
                              <Button variant="outline-info" size="sm" onClick={() => handlePrintWithoutHeader(avis)} title="Imprimer sans en-tête">
                                <FaFileAlt />
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(avis._id!)}>
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </div>

                          <h6 className="card-title">{avis.Patient}</h6>

                          <div className="small text-muted mb-2">
                            <div><strong>Diagnostic:</strong> {avis.Diagnostic}</div>
                            <div><strong>Durée probable de l'hospitalisation:</strong> {avis.DureHospit}</div>
                            <div><strong>Date d'intervention:</strong> {new Date(avis.DateIntervention).toLocaleDateString()}</div>
                            <div><strong>Heure:</strong> {avis.HeureHospit}</div>
                            <div><strong>Médecin traitant:</strong> {avis.MedecinTraitant}</div>
                            {avis.NumDoc && <div><strong>N° Document:</strong> {avis.NumDoc}</div>}
                          </div>

                          {avis.Isolement && (
                            <span
                              className="mt-2 me-3 d-inline-block text-white px-2 py-1 rounded"
                              style={{ fontSize: '0.65rem', backgroundColor: '#ffc107' }}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Isolement requis
                            </span>
                          )}
                          {avis.HospitAnt && (
                            <span
                              className="mt-2 me-3 d-inline-block text-white px-2 py-1 rounded"
                              style={{ fontSize: '0.65rem', backgroundColor: '#6c757d' }}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Déjà Hospitalisé(e)
                            </span>
                          )}
                          {avis.sejourunjour && (
                            <span
                              className="mt-2 me-3 d-inline-block text-white px-2 py-1 rounded"
                              style={{ fontSize: '0.65rem', backgroundColor: '#dc3545' }}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Séjour d'un jour
                            </span>
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </>
        ) : (
          /* Formulaire */
          <Form onSubmit={handleSubmit}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <FaUserMd className="me-2" />
                {editingAvis ? 'Modifier l\'avis' : 'Nouvel avis d\'hospitalisation'}
              </h5>
              <Button variant="outline-secondary" onClick={() => {
                setShowForm(false);
                resetForm();
              }}>
                <i className="bi bi-arrow-left me-2"></i>
                Retour à la liste
              </Button>
            </div>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Service d'hospitalisation *</Form.Label>
                  <Form.Select
                    name="serviceHospit"
                    value={formData.serviceHospit}
                    onChange={handleChange}
                    required
                  >
                    {services.map(service => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>État du patient *</Form.Label>
                  <Form.Select
                    name="etatPatient"
                    value={formData.etatPatient}
                    onChange={handleChange}
                    required
                  >
                    {etatsPatient.map(etat => (
                      <option key={etat.value} value={etat.value}>
                        {etat.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nom complet du patient *</Form.Label>
                  <Form.Control
                    type="text"
                    name="Patient"
                    value={formData.Patient}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Durée probable de l'hospitalisation *</Form.Label>
                  <Form.Control
                    type="text"
                    name="DureHospit"
                    value={formData.DureHospit}
                    onChange={handleChange}
                    placeholder="ex: 3 jours, 1 semaine..."
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date d'intervention *</Form.Label>
                  <Form.Control
                    type="date"
                    name="DateIntervention"
                    value={formData.DateIntervention}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Heure d'hospitalisation *</Form.Label>
                  <Form.Control
                    type="time"
                    name="HeureHospit"
                    value={formData.HeureHospit}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date prévue *</Form.Label>
                  <Form.Control
                    type="date"
                    name="DatePrevue"
                    value={formData.DatePrevue}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Numéro de document *</Form.Label>
                  <Form.Control
                    type="text"
                    name="NumDoc"
                    value={formData.NumDoc}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Médecin traitant *</Form.Label>
                  <Form.Control
                    type="text"
                    name="MedecinTraitant"
                    value={formData.MedecinTraitant}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Diagnostic *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="Diagnostic"
                    value={formData.Diagnostic}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Isolement</Form.Label>
                  <Form.Check
                    type="switch"
                    name="Isolement"
                    checked={formData.Isolement || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      Isolement: e.target.checked
                    }))}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Hospitalisation antérieure</Form.Label>
                  <Form.Check
                    type="switch"
                    name="HospitAnt"
                    checked={formData.HospitAnt || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      HospitAnt: e.target.checked
                    }))}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Séjour jour</Form.Label>
                  <Form.Check
                    type="switch"
                    name="sejourunjour"
                    checked={formData.sejourunjour || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sejourunjour: e.target.checked
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Assurance</Form.Label>
                  <Form.Control
                    type="text"
                    name="assurance"
                    value={formData.assurance || 'Pas assuré'}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Société patient</Form.Label>
                  <Form.Control
                    type="text"
                    name="SocieteP"
                    value={formData.SocieteP}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => {
                setShowForm(false);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingAvis ? 'Mettre à jour' : 'Enregistrer'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
