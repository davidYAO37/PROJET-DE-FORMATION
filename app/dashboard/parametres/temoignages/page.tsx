'use client';

import React, { useEffect, useState } from 'react';
import {
  Button, Container, Form, Modal, Row, Col, Spinner,
  Table, Toast, ToastContainer, Badge
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

interface Testimonial {
  _id?: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  active: boolean;
  order: number;
}

export default function TemoignagesAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' as 'success' | 'danger' | 'info' });

  const [form, setForm] = useState<Testimonial>({
    name: '',
    role: '',
    text: '',
    rating: 5,
    active: true,
    order: 0,
  });

  const showNotification = (message: string, variant: 'success' | 'danger' | 'info') => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials?active=false');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setTestimonials(data.data || []);
    } catch {
      showNotification('Impossible de charger les témoignages', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const resetForm = () => {
    setForm({ name: '', role: '', text: '', rating: 5, active: true, order: 0 });
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({ ...t });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, _id: editing._id } : form;
      const res = await fetch('/api/testimonials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'enregistrement');
      await fetchTestimonials();
      setShowModal(false);
      resetForm();
      showNotification(editing ? 'Témoignage modifié' : 'Témoignage ajouté', 'success');
    } catch {
      showNotification('Erreur lors de l\'enregistrement', 'danger');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Voulez-vous vraiment supprimer ce témoignage ?')) return;
    try {
      const res = await fetch(`/api/testimonials?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur');
      await fetchTestimonials();
      showNotification('Témoignage supprimé', 'info');
    } catch {
      showNotification('Erreur lors de la suppression', 'danger');
    }
  };

  return (
    <div className="flex-grow-1 bg-light min-vh-100">
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col><h2 className="fw-bold text-primary">Gestion des témoignages</h2></Col>
          <Col className="text-end">
            <Button variant="success" onClick={openAdd}><FaPlus className="me-2" />Ajouter</Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /> Chargement...</div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm p-3">
            <Table hover className="align-middle">
              <thead className="table-primary">
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Message</th>
                  <th>Note</th>
                  <th>Ordre</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted py-4">Aucun témoignage.</td></tr>
                ) : (
                  testimonials.map((t, idx) => (
                    <tr key={t._id}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{t.name}</td>
                      <td>{t.role}</td>
                      <td style={{ maxWidth: 300 }}><span className="text-muted">{t.text}</span></td>
                      <td><span className="text-warning">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span></td>
                      <td>{t.order}</td>
                      <td>
                        {t.active ? (
                          <Badge bg="success">Actif</Badge>
                        ) : (
                          <Badge bg="secondary">Inactif</Badge>
                        )}
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openEdit(t)}><FaEdit /></Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(t._id)}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Container>

      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Modifier le témoignage' : 'Ajouter un témoignage'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nom</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Rôle / Fonction</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    required
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Note (1 à 5)</Form.Label>
                  <Form.Select
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  >
                    <option value={5}>5 étoiles</option>
                    <option value={4}>4 étoiles</option>
                    <option value={3}>3 étoiles</option>
                    <option value={2}>2 étoiles</option>
                    <option value={1}>1 étoile</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Ordre d’affichage</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  />
                </Form.Group>
                <Form.Check
                  type="switch"
                  id="active-switch"
                  label="Actif"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
            <Button variant="primary" type="submit">{editing ? 'Enregistrer' : 'Ajouter'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast show={toast.show} bg={toast.variant} delay={3000} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
