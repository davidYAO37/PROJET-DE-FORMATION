'use client';
import { useState, useEffect, FormEvent } from 'react';
import { Modal, Card, Row, Col, Table, Button, Form, Badge, Alert } from 'react-bootstrap';
import { FaBriefcaseMedical, FaPlus, FaEdit, FaTrash, FaPrint, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from '@/utils/printRecu';
import { buildArretTravailCertificatHtml } from '@/lib/arretTravail/certificatArretTemplates';
import { ARRET_TRAVAIL_TYPES, ARRET_TRAVAIL_STATUTS, TypeArretTravail, StatutArretTravail } from '@/types/arretTravail';

interface ArretTravail {
  _id: string;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateDebut: Date;
  dateFin: Date;
  motif: string;
  medecinTraitant: string;
  statut: StatutArretTravail;
  document?: Buffer;
  numeroDocument: string;
  dateCreation: Date;
  medecinId?: string;
  entrepriseId?: string;
  observations?: string;
  typeArret: TypeArretTravail;
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
  patientCodeDossier?: string;
}

export const ARRET_CONFIG: Record<string, any> = {
  maladie: {
    label: "Avis d'arrêt de travail",
    showMotif: true,
    showCertificat: true,
  },
  accident_travail: {
    label: "Certificat AT/MP",
    showMotif: true,
    showCertificat: true,
    extraInfo: "AT/MP à déclarer obligatoirement",
  },
  prolongation: {
    label: "Prolongation d'arrêt",
    showMotif: false,
    showCertificat: true,
  },
  grossesse_pathologique: {
    label: "Grossesse pathologique",
    showMotif: true,
    showCertificat: true,
  },
  arret_derogatoire: {
    label: "Arrêt dérogatoire",
    showMotif: true,
    showCertificat: false,
  },
  conge_enfant_malade: {
    label: "Congé enfant malade",
    showMotif: true,
    showCertificat: false,
  },
  conge_proche_aidant: {
    label: "Congé proche aidant",
    showMotif: true,
    showCertificat: false,
  },
  maternite: {
    label: "Congé maternité",
    showMotif: false,
    showCertificat: false,
  },
  paternite: {
    label: "Congé paternité",
    showMotif: false,
    showCertificat: false,
  },
};

export default function ArretTravailModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
  patientCodeDossier
}: ArretTravailModalProps) {
  const [arrets, setArrets] = useState<ArretTravail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArret, setEditingArret] = useState<ArretTravail | null>(null);
  const currentUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
  const { entreprise } = useEntreprise();

  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    motif: '',
    medecinTraitant: currentUser,
    statut: 'en_cours' as StatutArretTravail,
    typeArret: 'maladie' as TypeArretTravail,
    observations: '',
    certificatMedical: true,
    numeroCertificat: '',
    medecinCertificat: '',
    dateCertificat: '',
    dureeJours: 0,
    dateReprise: ''
  });

  const canManageArret = (arret: ArretTravail) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finDate = new Date(arret.dateFin);
    finDate.setHours(0, 0, 0, 0);
    return (
      arret.medecinTraitant?.trim() === currentUser?.trim() &&
      arret.statut === 'en_cours' &&
      finDate >= today
    );
  };

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
      medecinTraitant: currentUser,
      statut: 'en_cours',
      typeArret: 'maladie',
      observations: '',
      certificatMedical: true,
      numeroCertificat: '',
      medecinCertificat: '',
      dateCertificat: '',
      dureeJours: 0,
      dateReprise: ''
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
      medecinTraitant: arret.medecinTraitant || currentUser || '',
      statut: arret.statut,
      typeArret: arret.typeArret || 'maladie',
      observations: arret.observations || '',
      certificatMedical: arret.certificatMedical ?? true,
      numeroCertificat: arret.numeroCertificat || '',
      medecinCertificat: arret.medecinCertificat || '',
      dateCertificat: arret.dateCertificat ? new Date(arret.dateCertificat).toISOString().split('T')[0] : '',
      dureeJours: arret.dureeJours || 0,
      dateReprise: arret.dateReprise ? new Date(arret.dateReprise).toISOString().split('T')[0] : ''
    });
    setEditingArret(arret);
    setShowAddModal(true);
  };

  // Sauvegarder l'arrêt de travail
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const url = editingArret
        ? `/api/arrettravail/${editingArret._id}`
        : '/api/arrettravail';

      const method = editingArret ? 'PUT' : 'POST';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const debutDate = new Date(formData.dateDebut);
      debutDate.setHours(0, 0, 0, 0);

      if (!editingArret && debutDate < today) {
        setError('La date de début ne peut pas être antérieure à aujourd\'hui');
        return;
      }

      if (editingArret) {
        const originalDebut = new Date(editingArret.dateDebut);
        originalDebut.setHours(0, 0, 0, 0);
        if (debutDate < today && debutDate.getTime() !== originalDebut.getTime()) {
          setError('La date de début ne peut pas être antérieure à aujourd\'hui');
          return;
        }
      }

      let numeroDocument = editingArret?.numeroDocument;
      if (!numeroDocument && patientCodeDossier) {
        const count = arrets.length + 1;
        numeroDocument = `${patientCodeDossier}-${count}`;
      } else if (!numeroDocument) {
        numeroDocument = `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }

      const payload = {
        ...formData,
        patientId,
        patientNom,
        patientPrenoms,
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        dateCertificat: formData.dateCertificat || undefined,
        numeroDocument,
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

      setSuccess(result.message || (editingArret ? 'Arrêt de travail modifié avec succès' : 'Arrêt de travail ajouté avec succès'));
      setTimeout(() => setSuccess(''), 3000);

      // Recharger la liste
      const arretsResponse = await fetch(`/api/arrettravail?patientId=${patientId}`);
      if (arretsResponse.ok) {
        const data = await arretsResponse.json();
        setArrets(data.data || []);
      }

      setShowAddModal(false);
      resetForm();
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
        headers: {
          'x-user-name': currentUser,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      setSuccess(result.message || 'Arrêt de travail supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);

      // Recharger la liste
      setArrets(arrets.filter(a => a._id !== arretId));
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const getTypeArretLibelle = (typeArret: ArretTravail['typeArret']) => {
    switch (typeArret) {
      case 'maladie': return 'Avis d\'arrêt de travail';
      case 'accident_travail': return 'Certificat médical AT/MP';
      case 'prolongation': return 'Prolongation d\'arrêt de travail';
      case 'grossesse_pathologique': return 'Grossesse pathologique';
      case 'arret_derogatoire': return 'Arrêt dérogatoire';
      case 'conge_enfant_malade': return 'Congé enfant malade';
      case 'conge_proche_aidant': return 'Congé proche aidant';
      case 'maternite': return 'Congé maternité';
      case 'paternite': return 'Congé paternité';
      default: return 'Arrêt de travail';
    }
  };

  const getTypeArretDescription = (typeArret: ArretTravail['typeArret']) => {
    switch (typeArret) {
      case 'maladie':
        return 'Avis d\'arrêt de travail pour maladie ordinaire. Le patient doit transmettre le volet 3 à l\'employeur sous 48h.';
      case 'accident_travail':
        return 'Certificat médical pour accident du travail ou maladie professionnelle. Document spécifique (Cerfa AT/MP) à conserver et transmettre rapidement.';
      case 'prolongation':
        return 'Certificat de prolongation d\'arrêt de travail. Il prolonge l\'arrêt initial et précise la nouvelle période.';
      case 'grossesse_pathologique':
        return 'Arrêt de travail lié à une grossesse pathologique. Prend en compte les complications médicales spécifiques.';
      case 'arret_derogatoire':
        return 'Arrêt dérogatoire, notamment pour isolement sanitaire ou situation exceptionnelle.';
      case 'conge_enfant_malade':
        return 'Congé pour enfant malade ou présence parentale. Le document peut être transmis à l\'employeur pour justification.';
      case 'conge_proche_aidant':
        return 'Congé proche aidant pour s\'occuper d\'un proche dépendant. Document médical nécessaire pour l\'indemnisation.';
      case 'maternite':
        return 'Congé maternité. Le cas est traité comme un arrêt de travail spécifique à la grossesse.';
      case 'paternite':
        return 'Congé paternité. Le document atteste de la nécessité de l\'absence pour prise en charge du nouveau-né.';
      default:
        return 'Arrêt de travail pour une situation spécifique non couverte par les autres catégories.';
    }
  };

  const getArretPrintContent = (arret: ArretTravail) => {
    return buildArretTravailCertificatHtml(arret, {
      cliniqueNom: entreprise?.NomSociete || 'CLINIQUE',
      medecinDefaut: arret.medecinTraitant || currentUser || 'Docteur inconnu',
      villeSignature: 'Abidjan',
    });
  };

  const handlePrintWithHeader = (arret: ArretTravail) => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    const contentHTML = getArretPrintContent(arret);
    createPrintWindow('Arrêt de travail', headerHTML, contentHTML, footerHTML);
  };

  const handlePrintWithoutHeader = (arret: ArretTravail) => {
    const contentHTML = getArretPrintContent(arret);
    createPrintWindowWithoutHeader('Arrêt de travail', contentHTML);
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
                          disabled={!canManageArret(arret)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handlePrintWithHeader(arret)}
                          title="Imprimer avec entête"
                        >
                          <FaPrint />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handlePrintWithoutHeader(arret)}
                          title="Imprimer sans entête"
                        >
                          <FaFileAlt />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(arret._id)}
                          title="Supprimer"
                          disabled={!canManageArret(arret)}
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
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                placeholder="Motif de l'arrêt de travail..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Médecin traitant *</Form.Label>
              <Form.Control
                type="text"
                value={formData.medecinTraitant}
                onChange={(e) => setFormData({ ...formData, medecinTraitant: e.target.value })}
                placeholder="Nom du médecin traitant..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
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
                onChange={(e) => setFormData({ ...formData, typeArret: e.target.value as any })}
              >
                <option value="maladie">Avis d'arrêt</option>
                <option value="accident_travail">Certificat AT/MP</option>
                <option value="prolongation">Prolongation d\'arrêt</option>
                <option value="grossesse_pathologique">Grossesse pathologique</option>
                <option value="arret_derogatoire">Arrêt dérogatoire</option>
                <option value="conge_enfant_malade">Congé enfant malade</option>
                <option value="conge_proche_aidant">Congé proche aidant</option>
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
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observations supplémentaires..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Certificat médical"
                checked={formData.certificatMedical}
                onChange={(e) => setFormData({ ...formData, certificatMedical: e.target.checked })}
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
                        onChange={(e) => setFormData({ ...formData, numeroCertificat: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, dateCertificat: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Médecin certificat</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.medecinCertificat}
                    onChange={(e) => setFormData({ ...formData, medecinCertificat: e.target.value })}
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
