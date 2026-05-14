'use client';
import { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Table, Button, Form, Badge, Alert } from 'react-bootstrap';
import { FaBriefcaseMedical, FaPlus, FaEdit, FaTrash, FaPrint, FaCalendarAlt } from 'react-icons/fa';

interface ArretTravail {
  _id: string;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateDebut: Date;
  dateFin: Date;
  motif: string;
  medecinTraitant: string;
  statut: 'en_cours' | 'termine' | 'annule';
  document?: Buffer;
  numeroDocument: string;
  dateCreation: Date;
  medecinId?: string;
  entrepriseId?: string;
  observations?: string;
  typeArret: 'maladie' | 'accident_travail' | 'maternite' | 'paternite' | 'autre';
  dureeJours: number;
  dateReprise?: Date;
  certificatMedical?: boolean;
  numeroCertificat?: string;
  medecinCertificat?: string;
  dateCertificat?: Date;
}

interface ArretTravailModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
}

export default function ArretTravailModal({ 
  show, 
  onHide, 
  patientId, 
  patientNom, 
  patientPrenoms 
}: ArretTravailModalProps) {
  const [arrets, setArrets] = useState<ArretTravail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArret, setEditingArret] = useState<ArretTravail | null>(null);
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    motif: '',
    medecinTraitant: '',
    statut: 'en_cours' as 'en_cours' | 'termine' | 'annule',
    typeArret: 'maladie' as 'maladie' | 'accident_travail' | 'maternite' | 'paternite' | 'autre',
    observations: '',
    certificatMedical: true,
    numeroCertificat: '',
    medecinCertificat: '',
    dateCertificat: ''
  });

  // Charger les arrêts de travail du patient
  useEffect(() => {
    const chargerArrets = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(`/api/arrettravail?patientId=${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setArrets(data.data || []);
        } else {
          // Si l'API n'existe pas encore, on retourne un tableau vide
          setArrets([]);
        }
      } catch (err: any) {
        setError(err.message);
        setArrets([]);
      } finally {
        setLoading(false);
      }
    };

    if (show && patientId) {
      chargerArrets();
    }
  }, [show, patientId]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      dateDebut: '',
      dateFin: '',
      motif: '',
      medecinTraitant: '',
      statut: 'en_cours',
      typeArret: 'maladie',
      observations: '',
      certificatMedical: true,
      numeroCertificat: '',
      medecinCertificat: '',
      dateCertificat: ''
    });
    setEditingArret(null);
  };

  // Ouvrir le modal d'ajout
  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (arret: ArretTravail) => {
    setFormData({
      dateDebut: new Date(arret.dateDebut).toISOString().split('T')[0],
      dateFin: new Date(arret.dateFin).toISOString().split('T')[0],
      motif: arret.motif,
      medecinTraitant: arret.medecinTraitant,
      statut: arret.statut,
      typeArret: arret.typeArret || 'maladie',
      observations: arret.observations || '',
      certificatMedical: arret.certificatMedical ?? true,
      numeroCertificat: arret.numeroCertificat || '',
      medecinCertificat: arret.medecinCertificat || '',
      dateCertificat: arret.dateCertificat ? new Date(arret.dateCertificat).toISOString().split('T')[0] : ''
    });
    setEditingArret(arret);
    setShowAddModal(true);
  };

  // Sauvegarder l'arrêt de travail
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingArret 
        ? `/api/arrettravail/${editingArret._id}`
        : '/api/arrettravail';
      
      const method = editingArret ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        patientId,
        patientNom,
        patientPrenoms,
        dateDebut: new Date(formData.dateDebut),
        dateFin: new Date(formData.dateFin),
        dateCertificat: formData.dateCertificat ? new Date(formData.dateCertificat) : undefined,
        numeroDocument: `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(editingArret ? 'Arrêt de travail modifié avec succès' : 'Arrêt de travail ajouté avec succès');
        setTimeout(() => setSuccess(''), 3000);
        
        // Recharger la liste
        const arretsResponse = await fetch(`/api/arrettravail?patientId=${patientId}`);
        if (arretsResponse.ok) {
          const data = await arretsResponse.json();
          setArrets(data.data || []);
        }
        
        setShowAddModal(false);
        resetForm();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Supprimer un arrêt de travail
  const handleDelete = async (arretId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet arrêt de travail ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/arrettravail/${arretId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Arrêt de travail supprimé avec succès');
        setTimeout(() => setSuccess(''), 3000);
        
        // Recharger la liste
        setArrets(arrets.filter(a => a._id !== arretId));
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Imprimer un arrêt de travail
  const handlePrint = (arret: ArretTravail) => {
    // Créer une fenêtre d'impression
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Arrêt de Travail - ${arret.numeroDocument}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .info-section { margin-bottom: 20px; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-label { font-weight: bold; width: 150px; }
            .footer { text-align: center; margin-top: 50px; font-style: italic; }
            @media print { body { font-size: 12px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ARRÊT DE TRAVAIL</h2>
            <h3>N° ${arret.numeroDocument}</h3>
          </div>
          
          <div class="info-section">
            <h4>Informations Patient</h4>
            <div class="info-row">
              <span class="info-label">Nom:</span>
              <span>${arret.patientNom} ${arret.patientPrenoms}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h4>Détails de l'Arrêt</h4>
            <div class="info-row">
              <span class="info-label">Date début:</span>
              <span>${new Date(arret.dateDebut).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date fin:</span>
              <span>${new Date(arret.dateFin).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Durée:</span>
              <span>${Math.ceil((new Date(arret.dateFin).getTime() - new Date(arret.dateDebut).getTime()) / (1000 * 60 * 60 * 24))} jours</span>
            </div>
            <div class="info-row">
              <span class="info-label">Motif:</span>
              <span>${arret.motif}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Médecin traitant:</span>
              <span>${arret.medecinTraitant}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Statut:</span>
              <span>${arret.statut === 'en_cours' ? 'En cours' : arret.statut === 'termine' ? 'Terminé' : 'Annulé'}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Fait le ${new Date(arret.dateCreation).toLocaleDateString('fr-FR')}</p>
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

  // Obtenir la couleur du badge selon le statut
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'warning';
      case 'termine': return 'success';
      case 'annule': return 'danger';
      default: return 'secondary';
    }
  };

  // Obtenir le libellé du statut
  const getStatutLibelle = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title className="d-flex align-items-center">
            <FaBriefcaseMedical className="me-2" />
            Gestion des Arrêts de Travail
            <Badge bg="warning" className="ms-2">{arrets.length}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">
              Patient: {patientNom} {patientPrenoms}
            </h5>
            <Button variant="primary" onClick={handleAdd}>
              <FaPlus className="me-2" />
              Nouvel Arrêt
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : arrets.length > 0 ? (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>N° Document</th>
                  <th>Date Début</th>
                  <th>Date Fin</th>
                  <th>Durée</th>
                  <th>Motif</th>
                  <th>Médecin Traitant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {arrets.map((arret) => (
                  <tr key={arret._id}>
                    <td className="fw-bold">{arret.numeroDocument}</td>
                    <td>{new Date(arret.dateDebut).toLocaleDateString('fr-FR')}</td>
                    <td>{new Date(arret.dateFin).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {Math.ceil((new Date(arret.dateFin).getTime() - new Date(arret.dateDebut).getTime()) / (1000 * 60 * 60 * 24))} jours
                    </td>
                    <td>{arret.motif.substring(0, 30)}...</td>
                    <td>{arret.medecinTraitant}</td>
                    <td>
                      <Badge bg={getStatutBadge(arret.statut)}>
                        {getStatutLibelle(arret.statut)}
                      </Badge>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(arret)}
                          title="Modifier"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handlePrint(arret)}
                          title="Imprimer"
                        >
                          <FaPrint />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(arret._id)}
                          title="Supprimer"
                        >
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
              <FaBriefcaseMedical className="text-muted fs-1 mb-3" />
              <p className="text-muted">Aucun arrêt de travail trouvé</p>
              <Button variant="primary" onClick={handleAdd}>
                <FaPlus className="me-2" />
                Créer le premier arrêt de travail
              </Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Ajout/Modification */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingArret ? 'Modifier l\'Arrêt de Travail' : 'Nouvel Arrêt de Travail'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSave}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de début *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de fin *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                    min={formData.dateDebut}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Motif *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.motif}
                onChange={(e) => setFormData({...formData, motif: e.target.value})}
                placeholder="Motif de l'arrêt de travail..."
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Médecin traitant *</Form.Label>
              <Form.Control
                type="text"
                value={formData.medecinTraitant}
                onChange={(e) => setFormData({...formData, medecinTraitant: e.target.value})}
                placeholder="Nom du médecin traitant..."
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                value={formData.statut}
                onChange={(e) => setFormData({...formData, statut: e.target.value as any})}
              >
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Type d'arrêt</Form.Label>
              <Form.Select
                value={formData.typeArret}
                onChange={(e) => setFormData({...formData, typeArret: e.target.value as any})}
              >
                <option value="maladie">Maladie</option>
                <option value="accident_travail">Accident de travail</option>
                <option value="maternite">Maternité</option>
                <option value="paternite">Paternité</option>
                <option value="autre">Autre</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Observations</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
                placeholder="Observations supplémentaires..."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Certificat médical"
                checked={formData.certificatMedical}
                onChange={(e) => setFormData({...formData, certificatMedical: e.target.checked})}
              />
            </Form.Group>
            
            {formData.certificatMedical && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Numéro certificat</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.numeroCertificat}
                        onChange={(e) => setFormData({...formData, numeroCertificat: e.target.value})}
                        placeholder="Numéro du certificat médical..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date certificat</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.dateCertificat}
                        onChange={(e) => setFormData({...formData, dateCertificat: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Médecin certificat</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.medecinCertificat}
                    onChange={(e) => setFormData({...formData, medecinCertificat: e.target.value})}
                    placeholder="Médecin ayant établi le certificat..."
                  />
                </Form.Group>
              </>
            )}
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                {editingArret ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
