'use client';
import { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Form, Button, Alert, Badge } from 'react-bootstrap';
import { FaHospitalUser, FaPrint, FaSave } from 'react-icons/fa';

interface RapportHospitalisation {
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateEntree: Date;
  dateSortie: Date;
  service: string;
  motifHospitalisation: string;
  diagnosticAdmission: string;
  diagnosticFinal: string;
  histoireMaladie: string;
    examenClinique: string;
    examensParacliniques: string;
    traitementAdministre: string;
    evolution: string;
    complications: string;
    suitesHospitalisation: string;
    medecinTraitant: string;
    medecinChefService: string;
    recommandations: string;
    dateRapport: Date;
}

interface RapportHospitalisationModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
}

export default function RapportHospitalisationModal({ 
  show, 
  onHide, 
  patientId, 
  patientNom, 
  patientPrenoms 
}: RapportHospitalisationModalProps) {
  const [formData, setFormData] = useState<RapportHospitalisation>({
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
    dateRapport: new Date()
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Réinitialiser le formulaire
  useEffect(() => {
    if (show) {
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
        dateRapport: new Date()
      });
    }
  }, [show, patientId, patientNom, patientPrenoms]);

  // Sauvegarder le rapport
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/rapportHospitalisation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Rapport d\'hospitalisation généré avec succès');
        setTimeout(() => {
          setSuccess('');
          onHide();
        }, 2000);
      } else {
        throw new Error('Erreur lors de la génération du rapport');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Imprimer le rapport
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rapport d'Hospitalisation</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .info-item { display: flex; }
            .info-label { font-weight: bold; width: 150px; }
            .footer { text-align: center; margin-top: 50px; font-style: italic; }
            @media print { body { font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RAPPORT D'HOSPITALISATION</h2>
            <p>Patient: ${formData.patientNom} ${formData.patientPrenoms}</p>
            <p>Service: ${formData.service || 'N/A'}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Date d'entrée:</span>
              <span>${new Date(formData.dateEntree).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date de sortie:</span>
              <span>${new Date(formData.dateSortie).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Durée:</span>
              <span>${Math.ceil((new Date(formData.dateSortie).getTime() - new Date(formData.dateEntree).getTime()) / (1000 * 60 * 60 * 24))} jours</span>
            </div>
            <div class="info-item">
              <span class="info-label">Médecin traitant:</span>
              <span>${formData.medecinTraitant || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Chef de service:</span>
              <span>${formData.medecinChefService || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date du rapport:</span>
              <span>${new Date(formData.dateRapport).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">MOTIF D'HOSPITALISATION</div>
            <p>${formData.motifHospitalisation || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">HISTOIRE DE LA MALADIE</div>
            <p style="white-space: pre-line;">${formData.histoireMaladie || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">EXAMEN CLINIQUE</div>
            <p style="white-space: pre-line;">${formData.examenClinique || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">EXAMENS PARACLINIQUES</div>
            <p style="white-space: pre-line;">${formData.examensParacliniques || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">DIAGNOSTIC D'ADMISSION</div>
            <p>${formData.diagnosticAdmission || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">DIAGNOSTIC FINAL</div>
            <p>${formData.diagnosticFinal || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">TRAITEMENT ADMINISTRÉ</div>
            <p style="white-space: pre-line;">${formData.traitementAdministre || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">ÉVOLUTION</div>
            <p style="white-space: pre-line;">${formData.evolution || 'Non spécifié'}</p>
          </div>
          
          ${formData.complications ? `
          <div class="section">
            <div class="section-title">COMPLICATIONS</div>
            <p style="white-space: pre-line;">${formData.complications}</p>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">SUITES D'HOSPITALISATION</div>
            <p style="white-space: pre-line;">${formData.suitesHospitalisation || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">RECOMMANDATIONS</div>
            <p style="white-space: pre-line;">${formData.recommandations || 'Non spécifié'}</p>
          </div>
          
          <div class="footer">
            <p>Fait le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Document généré par le système de gestion médicale</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaHospitalUser className="me-2" />
          Génération du Rapport d'Hospitalisation
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

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
                      value={formData.dateEntree.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({...formData, dateEntree: new Date(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de sortie *</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.dateSortie.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({...formData, dateSortie: new Date(e.target.value)})}
                      min={formData.dateEntree.toISOString().split('T')[0]}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Service *</Form.Label>
                    <Form.Select
                      value={formData.service}
                      onChange={(e) => setFormData({...formData, service: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, medecinTraitant: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, medecinChefService: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, motifHospitalisation: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, diagnosticAdmission: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, diagnosticFinal: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, histoireMaladie: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, examenClinique: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, examensParacliniques: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, traitementAdministre: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, evolution: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, complications: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, suitesHospitalisation: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, recommandations: e.target.value})}
                  placeholder="Recommandations pour le suivi..."
                  required
                />
              </Form.Group>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between">
            <Button variant="outline-success" onClick={handlePrint}>
              <FaPrint className="me-2" />
              Aperçu Impression
            </Button>
            <div>
              <Button variant="secondary" className="me-2" onClick={onHide}>
                Annuler
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                <FaSave className="me-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
