'use client';

import { Medecin } from '@/types/medecin';
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface AjouterMedecinProps {
  show: boolean;
  onHide: () => void;
  onAdd: (medecin: Medecin) => void;
}



export default function AjouterMedecin({ show, onHide, onAdd }: AjouterMedecinProps) {
  const [nom, setNom] = useState('');
  const [prenoms, setPrenoms] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/medecins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, prenoms, specialite }),
      });

      if (response.ok) {
        const newMedecin = await response.json();
        onAdd(newMedecin);
        onHide();
        setNom('');
        setPrenoms('');
        setSpecialite('');
      }
    } catch (error) {
      console.error('Erreur ajout médecin', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un Médecin</Modal.Title>
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
          <div className="text-end">
            <Button variant="secondary" onClick={onHide} className="me-2">Annuler</Button>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
