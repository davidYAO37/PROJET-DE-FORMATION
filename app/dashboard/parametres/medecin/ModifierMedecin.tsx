'use client';

import { Medecin } from '@/types/medecin';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

interface ModifierMedecinProps {
  show: boolean;
  onHide: () => void;
  medecin: Medecin | null;
  onSave: (updatedMedecin: Medecin) => void;
}



export default function ModifierMedecin({ show, onHide, medecin, onSave }: ModifierMedecinProps) {
  const [nom, setNom] = useState('');
  const [prenoms, setPrenoms] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [tauxHonoraire, setTauxHonoraire] = useState('');
  const [tauxPrescription, setTauxPrescription] = useState('');
  const [tauxExecution, setTauxExecution] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (medecin) {
      setNom(medecin?.nom!);
      setPrenoms(medecin?.prenoms!);
      setSpecialite(medecin?.specialite!);
      setTauxHonoraire(String(medecin?.TauxHonoraire || ''));
      setTauxPrescription(String(medecin?.TauxPrescription || ''));
      setTauxExecution(String(medecin?.TauxExecution || ''));
    }
  }, [medecin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medecin) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/medecins/${medecin._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nom, 
          prenoms, 
          specialite, 
          TauxHonoraire: Number(tauxHonoraire), 
          TauxPrescription: Number(tauxPrescription), 
          TauxExecution: Number(tauxExecution) 
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        onSave(updated);
        onHide();
      }
    } catch (error) {
      console.error('Erreur modification médecin', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Modifier Médecin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control value={nom} onChange={(e) => setNom(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Prénoms</Form.Label>
            <Form.Control value={prenoms} onChange={(e) => setPrenoms(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Spécialité</Form.Label>
            <Form.Control value={specialite} onChange={(e) => setSpecialite(e.target.value)} required />
          </Form.Group>
          <Row>
            <Col className="col-4">
              <Form.Group className="mb-3">
                <Form.Label>Taux Honoraire</Form.Label>
                <Form.Control type="number" value={tauxHonoraire} onChange={(e) => setTauxHonoraire(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col className="col-4">
              <Form.Group className="mb-3">
                <Form.Label>Taux Prescription</Form.Label>
                <Form.Control type="number" value={tauxPrescription} onChange={(e) => setTauxPrescription(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col className="col-4">
              <Form.Group className="mb-3">
                <Form.Label>Taux Execution</Form.Label>
                <Form.Control type="number" value={tauxExecution} onChange={(e) => setTauxExecution(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end">
            <Button variant="secondary" onClick={onHide} className="me-2">Annuler</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Mise à jour...
                </>
              ) : 'Enregistrer'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
