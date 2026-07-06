'use client';

import { Infirmier } from '@/types/infirmier';
import React, { useState } from 'react';
import { Modal, Button, Form, Col, Row } from 'react-bootstrap';

interface AjouterInfirmierProps {
  show: boolean;
  onHide: () => void;
  onAdd: (infirmier: Infirmier) => void;
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

export default function AjouterInfirmier({ show, onHide, onAdd }: AjouterInfirmierProps) {
  const [nom, setNom] = useState('');
  const [prenoms, setPrenoms] = useState('');
  const [service, setService] = useState('');
  const [grade, setGrade] = useState('');
  const [telephone, setTelephone] = useState('');
  const [emailInf, setEmailInf] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { nom, prenoms, service, grade, telephone, EmailInf: emailInf };

      const response = await fetch('/api/infirmiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newInfirmier = await response.json();
        onAdd(newInfirmier);
        setNom('');
        setPrenoms('');
        setService('');
        setGrade('');
        setTelephone('');
        setEmailInf('');
        onHide();
      }
    } catch (error) {
      console.error('Erreur ajout infirmier', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un Infirmier</Modal.Title>
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
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Ajout...</>
              ) : 'Ajouter'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
