"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col, Card, Badge, Table } from 'react-bootstrap';
import { FaHospital, FaPlus, FaEdit, FaTrash, FaSave } from 'react-icons/fa';

interface TypeHospitalisation {
  _id?: string;
  designation: string;
  description?: string;
  couleur?: string;
  active?: boolean;
  entrepriseId?: string;
}

interface TypesHospitalisationModalProps {
  show: boolean;
  onHide: () => void;
  entrepriseId: string;
}

export default function TypesHospitalisationModal({ 
  show, 
  onHide, 
  entrepriseId 
}: TypesHospitalisationModalProps) {
  const [types, setTypes] = useState<TypeHospitalisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Formulaire
  const [formData, setFormData] = useState<Partial<TypeHospitalisation>>({
    designation: '',
    description: '',
    couleur: '#0dcaf0',
    active: true
  });
  
  const [editingType, setEditingType] = useState<TypeHospitalisation | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Charger les types
  const fetchTypes = async () => {
    if (!entrepriseId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/typesHospitalisation?entrepriseId=${encodeURIComponent(entrepriseId)}`);
      if (res.ok) {
        const data = await res.json();
        setTypes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement types:', error);
      setError('Erreur lors du chargement des types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && entrepriseId) {
      fetchTypes();
    }
  }, [show, entrepriseId]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      designation: '',
      description: '',
      couleur: '#0dcaf0',
      active: true
    });
    setEditingType(null);
    setShowForm(false);
  };

  // Gérer le changement du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: Partial<TypeHospitalisation>) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Sauvegarder un type
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.designation?.trim()) {
      setError('La désignation est requise');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...formData,
        entrepriseId,
        ...(editingType && { _id: editingType._id })
      };

      const method = editingType ? 'PUT' : 'POST';
      const res = await fetch('/api/typesHospitalisation', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const result = await res.json();
      
      if (editingType) {
        setTypes(prev => prev.map(t => t._id === result._id ? result : t));
        setSuccess('Type d\'hospitalisation modifié avec succès');
      } else {
        setTypes(prev => [...prev, result]);
        setSuccess('Type d\'hospitalisation ajouté avec succès');
      }

      resetForm();
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Modifier un type
  const handleEdit = (type: TypeHospitalisation) => {
    setFormData(type);
    setEditingType(type);
    setShowForm(true);
  };

  // Supprimer un type
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver ce type d\'hospitalisation ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/typesHospitalisation?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setTypes(prev => prev.filter(t => t._id !== id));
      setSuccess('Type d\'hospitalisation désactivé avec succès');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Erreur suppression:', error);
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaHospital className="me-2" />
          Gestion des Types d'Hospitalisation
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {!showForm ? (
          <>
            {/* Bouton d'ajout */}
            <div className="mb-3">
              <Button 
                variant="primary" 
                onClick={() => setShowForm(true)}
              >
                <FaPlus className="me-2" />
                Ajouter un type d'hospitalisation
              </Button>
            </div>

            {/* Liste des types */}
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
                <p className="mt-2">Chargement...</p>
              </div>
            ) : types.length === 0 ? (
              <Alert variant="info">
                Aucun type d'hospitalisation configuré.
              </Alert>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>Description</th>
                    <th>Couleur</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((type) => (
                    <tr key={type._id}>
                      <td className="fw-bold">{type.designation}</td>
                      <td>{type.description || '—'}</td>
                      <td>
                        <Badge 
                          style={{ 
                            backgroundColor: type.couleur || '#0dcaf0',
                            color: 'white'
                          }}
                        >
                          {type.couleur || '#0dcaf0'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={type.active ? 'success' : 'secondary'}>
                          {type.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(type)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(type._id!)}
                            disabled={!type.active}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        ) : (
          /* Formulaire d'ajout/modification */
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                {editingType ? 'Modifier' : 'Ajouter'} un type d'hospitalisation
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Désignation *</Form.Label>
                      <Form.Control
                        type="text"
                        name="designation"
                        value={formData.designation || ''}
                        onChange={handleChange}
                        placeholder="Ex: HOSPITALISATION MEDICALE"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Couleur</Form.Label>
                      <Form.Control
                        type="color"
                        name="couleur"
                        value={formData.couleur || '#0dcaf0'}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Description du type d'hospitalisation..."
                      />
                    </Form.Group>
                  </Col>
                  {editingType && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Check
                          type="checkbox"
                          name="active"
                          label="Actif"
                          checked={formData.active || false}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <div className="mt-4 d-flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" />
                        {' '}Enregistrement...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {editingType ? 'Modifier' : 'Ajouter'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                  >
                    Annuler
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
