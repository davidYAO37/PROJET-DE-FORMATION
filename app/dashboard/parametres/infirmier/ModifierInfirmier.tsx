'use client';

import { Infirmier } from '@/types/infirmier';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

interface ModifierInfirmierProps {
  show: boolean;
  onHide: () => void;
  infirmier: Infirmier | null;
  onSave: (updatedInfirmier: Infirmier) => void;
}

const SERVICES = [
  'Urgences',
  'Chirurgie',
  'Médecine Interne',
  'Pédiatrie',
  'Maternité',
  'Réanimation / Soins Intensifs',
  'Cardiologie',
  'Neurologie',
  'Oncologie',
  'Orthopédie',
  'Ophtalmologie',
  'ORL',
  'Dermatologie',
  'Psychiatrie',
  'Radiologie',
  'Bloc Opératoire',
  'Consultations Externes',
  'Soins à Domicile',
];

const GRADES = [
  'Infirmier(e) Diplômé(e) d\'État',
  'Infirmier(e) Spécialisé(e)',
  'Infirmier(e) Chef',
  'Aide-Soignant(e)',
  'Infirmier(e) Anesthésiste',
  'Infirmier(e) de Bloc Opératoire',
  'Puériculteur(trice)',
  'Sage-Femme',
];

export default function ModifierInfirmier({ show, onHide, infirmier, onSave }: ModifierInfirmierProps) {
  const [nom, setNom] = useState('');
  const [prenoms, setPrenoms] = useState('');
  const [service, setService] = useState('');
  const [grade, setGrade] = useState('');
  const [telephone, setTelephone] = useState('');
  const [emailInf, setEmailInf] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (infirmier) {
      setNom(infirmier.nom || '');
      setPrenoms(infirmier.prenoms || '');
      setService(infirmier.service || '');
      setGrade(infirmier.grade || '');
      setTelephone(infirmier.telephone || '');
      setEmailInf(infirmier.EmailInf || '');
    }
  }, [infirmier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infirmier) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/infirmiers/${infirmier._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, prenoms, service, grade, telephone, EmailInf: emailInf }),
      });

      if (response.ok) {
        const updated = await response.json();
        onSave(updated);
        onHide();
      }
    } catch (error) {
      console.error('Erreur modification infirmier', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Modifier Infirmier</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control value={nom} onChange={(e) => setNom(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénoms</Form.Label>
                <Form.Control value={prenoms} onChange={(e) => setPrenoms(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Service</Form.Label>
                <Form.Select value={service} onChange={(e) => setService(e.target.value)} required>
                  <option value="">-- Sélectionner un service --</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Grade</Form.Label>
                <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">-- Sélectionner un grade --</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={emailInf} onChange={(e) => setEmailInf(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end">
            <Button variant="secondary" onClick={onHide} className="me-2">Annuler</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Mise à jour...</>
              ) : 'Enregistrer'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
