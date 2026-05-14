'use client';
import { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Form, Button, Alert, Badge } from 'react-bootstrap';
import { FaProcedures, FaPrint, FaSave } from 'react-icons/fa';

interface CompteRenduOperatoire {
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateIntervention: Date;
  heureIntervention: string;
  chirurgien: string;
  anesthesiste: string;
  typeAnesthesie: string;
  intervention: string;
  indication: string;
    technique: string;
    difficultes: string;
    complications: string;
    suitesOperatoires: string;
    piecesAnatomopathologiques: string;
    dureeIntervention: string;
    perteSanguine: string;
    transfusion: string;
    observation: string;
}

interface CompteRenduOperatoireModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
}

export default function CompteRenduOperatoireModal({ 
  show, 
  onHide, 
  patientId, 
  patientNom, 
  patientPrenoms 
}: CompteRenduOperatoireModalProps) {
  const [formData, setFormData] = useState<CompteRenduOperatoire>({
    patientId,
    patientNom,
    patientPrenoms,
    dateIntervention: new Date(),
    heureIntervention: '',
    chirurgien: '',
    anesthesiste: '',
    typeAnesthesie: '',
    intervention: '',
    indication: '',
    technique: '',
    difficultes: '',
    complications: '',
    suitesOperatoires: '',
    piecesAnatomopathologiques: '',
    dureeIntervention: '',
    perteSanguine: '',
    transfusion: '',
    observation: ''
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
        dateIntervention: new Date(),
        heureIntervention: '',
        chirurgien: '',
        anesthesiste: '',
        typeAnesthesie: '',
        intervention: '',
        indication: '',
        technique: '',
        difficultes: '',
        complications: '',
        suitesOperatoires: '',
        piecesAnatomopathologiques: '',
        dureeIntervention: '',
        perteSanguine: '',
        transfusion: '',
        observation: ''
      });
    }
  }, [show, patientId, patientNom, patientPrenoms]);

  // Sauvegarder le compte rendu
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/compterenduoperatoire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Compte rendu opératoire généré avec succès');
        setTimeout(() => {
          setSuccess('');
          onHide();
        }, 2000);
      } else {
        throw new Error('Erreur lors de la génération du compte rendu');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Imprimer le compte rendu
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Compte Rendu Opératoire</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .info-item { display: flex; }
            .info-label { font-weight: bold; width: 150px; }
            .footer { text-align: center; margin-top: 50px; font-style: italic; }
            @media print { body { font-size: 11px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>COMPTE RENDU OPÉRATOIRE</h2>
            <p>Patient: ${formData.patientNom} ${formData.patientPrenoms}</p>
            <p>Date: ${new Date(formData.dateIntervention).toLocaleDateString('fr-FR')}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Chirurgien:</span>
              <span>${formData.chirurgien || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Anesthésiste:</span>
              <span>${formData.anesthesiste || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Heure:</span>
              <span>${formData.heureIntervention || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type d'anesthésie:</span>
              <span>${formData.typeAnesthesie || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Durée:</span>
              <span>${formData.dureeIntervention || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Perte sanguine:</span>
              <span>${formData.perteSanguine || 'N/A'}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">INTERVENTION</div>
            <p>${formData.intervention || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">INDICATION</div>
            <p>${formData.indication || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">TECHNIQUE CHIRURGICALE</div>
            <p style="white-space: pre-line;">${formData.technique || 'Non spécifié'}</p>
          </div>
          
          ${formData.difficultes ? `
          <div class="section">
            <div class="section-title">DIFFICULTÉS RENCONTRÉES</div>
            <p style="white-space: pre-line;">${formData.difficultes}</p>
          </div>
          ` : ''}
          
          ${formData.complications ? `
          <div class="section">
            <div class="section-title">COMPLICATIONS</div>
            <p style="white-space: pre-line;">${formData.complications}</p>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">SUITES OPÉRATOIRES</div>
            <p style="white-space: pre-line;">${formData.suitesOperatoires || 'Non spécifié'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">PIÈCES ANATOMOPATHOLOGIQUES</div>
            <p>${formData.piecesAnatomopathologiques || 'Non spécifié'}</p>
          </div>
          
          ${formData.transfusion ? `
          <div class="section">
            <div class="section-title">TRANSFUSION</div>
            <p>${formData.transfusion}</p>
          </div>
          ` : ''}
          
          ${formData.observation ? `
          <div class="section">
            <div class="section-title">OBSERVATIONS</div>
            <p style="white-space: pre-line;">${formData.observation}</p>
          </div>
          ` : ''}
          
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
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaProcedures className="me-2" />
          Génération du Compte Rendu Opératoire
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
                    <Form.Label>Date d'intervention *</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.dateIntervention.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({...formData, dateIntervention: new Date(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure d'intervention</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.heureIntervention}
                      onChange={(e) => setFormData({...formData, heureIntervention: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Durée de l'intervention</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 2h30"
                      value={formData.dureeIntervention}
                      onChange={(e) => setFormData({...formData, dureeIntervention: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Chirurgien *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.chirurgien}
                      onChange={(e) => setFormData({...formData, chirurgien: e.target.value})}
                      placeholder="Nom du chirurgien"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Anesthésiste</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.anesthesiste}
                      onChange={(e) => setFormData({...formData, anesthesiste: e.target.value})}
                      placeholder="Nom de l'anesthésiste"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type d'anesthésie</Form.Label>
                    <Form.Select
                      value={formData.typeAnesthesie}
                      onChange={(e) => setFormData({...formData, typeAnesthesie: e.target.value})}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="generale">Anesthésie générale</option>
                      <option value="locale">Anesthésie locale</option>
                      <option value="locoregionale">Anesthésie locorégionale</option>
                      <option value="rachianesthesie">Rachianesthésie</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Perte sanguine</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 200 ml"
                      value={formData.perteSanguine}
                      onChange={(e) => setFormData({...formData, perteSanguine: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header className="bg-light">
              <h6 className="mb-0">Détails de l'Intervention</h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Intervention *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.intervention}
                  onChange={(e) => setFormData({...formData, intervention: e.target.value})}
                  placeholder="Nom de l'intervention"
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Indication *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.indication}
                  onChange={(e) => setFormData({...formData, indication: e.target.value})}
                  placeholder="Indication de l'intervention..."
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Technique chirurgicale *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={formData.technique}
                  onChange={(e) => setFormData({...formData, technique: e.target.value})}
                  placeholder="Description détaillée de la technique chirurgicale..."
                  required
                />
              </Form.Group>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header className="bg-light">
              <h6 className="mb-0">Complications et Suites</h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Difficultés rencontrées</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.difficultes}
                  onChange={(e) => setFormData({...formData, difficultes: e.target.value})}
                  placeholder="Difficultés rencontrées pendant l'intervention..."
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Complications</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.complications}
                  onChange={(e) => setFormData({...formData, complications: e.target.value})}
                  placeholder="Complications éventuelles..."
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Suites opératoires immédiates *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.suitesOperatoires}
                  onChange={(e) => setFormData({...formData, suitesOperatoires: e.target.value})}
                  placeholder="Description des suites opératoires immédiates..."
                  required
                />
              </Form.Group>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header className="bg-light">
              <h6 className="mb-0">Informations Complémentaires</h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Pièces anatomopathologiques</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.piecesAnatomopathologiques}
                  onChange={(e) => setFormData({...formData, piecesAnatomopathologiques: e.target.value})}
                  placeholder="Pièces envoyées en anatomopathologie..."
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Transfusion</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.transfusion}
                  onChange={(e) => setFormData({...formData, transfusion: e.target.value})}
                  placeholder="Détails de la transfusion si applicable..."
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Observations</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.observation}
                  onChange={(e) => setFormData({...formData, observation: e.target.value})}
                  placeholder="Observations supplémentaires..."
                />
              </Form.Group>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between">
            <Button variant="outline-info" onClick={handlePrint}>
              <FaPrint className="me-2" />
              Aperçu Impression
            </Button>
            <div>
              <Button variant="secondary" className="me-2" onClick={onHide}>
                Annuler
              </Button>
              <Button variant="info" type="submit" disabled={loading}>
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
