"use client";
import { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Form, Row, Col, Card, Modal } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaClock } from "react-icons/fa";
import { IParametreCRendu } from "@/models/ParametreCRendu";

interface ParametreCRenduManagerProps {
  onParametreSelect?: (parametre: IParametreCRendu) => void;
}

const ParametreCRenduManager: React.FC<ParametreCRenduManagerProps> = ({ onParametreSelect }) => {
  const [parametres, setParametres] = useState<IParametreCRendu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingParametre, setEditingParametre] = useState<IParametreCRendu | null>(null);
  const [formData, setFormData] = useState({
    LettreCle: "",
    Date: "",
    AjouterPar: "",
    HeureAjoute: ""
  });

  // Charger les paramètres
  const loadParametres = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/parametreCRendu");
      if (!response.ok) throw new Error("Erreur lors du chargement des paramètres");
      
      const data = await response.json();
      setParametres(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParametres();
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      LettreCle: "",
      Date: new Date().toISOString().split('T')[0],
      AjouterPar: "",
      HeureAjoute: new Date().toLocaleTimeString('fr-FR')
    });
    setEditingParametre(null);
  };

  // Ouvrir le modal pour ajouter
  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  // Ouvrir le modal pour modifier
  const handleEdit = (parametre: IParametreCRendu) => {
    setEditingParametre(parametre);
    setFormData({
      LettreCle: parametre.LettreCle,
      Date: new Date(parametre.Date).toISOString().split('T')[0],
      AjouterPar: parametre.AjouterPar,
      HeureAjoute: parametre.HeureAjoute
    });
    setShowModal(true);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editingParametre 
        ? `/api/parametreCRendu/${editingParametre._id}`
        : "/api/parametreCRendu";
      
      const method = editingParametre ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'opération");
      }

      await loadParametres();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un paramètre
  const handleDelete = async (parametre: IParametreCRendu) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ce paramètre (${parametre.LettreCle}) ?`)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/parametreCRendu/${parametre._id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      await loadParametres();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un paramètre
  const handleSelect = (parametre: IParametreCRendu) => {
    if (onParametreSelect) {
      onParametreSelect(parametre);
    }
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  };

  // Formater la date et heure
  const formatDateTime = (date: Date | string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('fr-FR')} ${time}`;
  };

  return (
    <div>
      <div className="mb-4">
        <Row>
          <Col>
            <h4><FaClock className="me-2" />Gestion des Paramètres de Compte Rendu</h4>
          </Col>
          <Col className="text-end">
            <Button variant="primary" onClick={handleAdd}>
              <FaPlus className="me-2" />Ajouter un Paramètre
            </Button>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead className="table-primary">
              <tr>
                <th>Lettre Clé</th>
                <th>Date</th>
                <th>Ajouté par</th>
                <th>Heure</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : parametres.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    Aucun paramètre trouvé
                  </td>
                </tr>
              ) : (
                parametres.map((parametre) => (
                  <tr 
                    key={parametre._id?.toString()}
                    style={{ cursor: onParametreSelect ? "pointer" : "default" }}
                    onClick={() => handleSelect(parametre)}
                  >
                    <td><strong>{parametre.LettreCle}</strong></td>
                    <td>{formatDate(parametre.Date)}</td>
                    <td>{parametre.AjouterPar}</td>
                    <td>{parametre.HeureAjoute}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(parametre);
                        }}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(parametre);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal pour ajouter/modifier */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingParametre ? (
              <>
                <FaEdit className="me-2" />
                Modifier le Paramètre
              </>
            ) : (
              <>
                <FaPlus className="me-2" />
                Ajouter un Paramètre
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lettre Clé *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.LettreCle}
                    onChange={(e) => setFormData({ ...formData, LettreCle: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.Date}
                    onChange={(e) => setFormData({ ...formData, Date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ajouté par *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.AjouterPar}
                    onChange={(e) => setFormData({ ...formData, AjouterPar: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.HeureAjoute}
                    onChange={(e) => setFormData({ ...formData, HeureAjoute: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                <FaTimes className="me-2" />Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                {editingParametre ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ParametreCRenduManager;
