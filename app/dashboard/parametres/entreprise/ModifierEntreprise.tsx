'use client';
import { Entreprise } from '@/types/entreprise';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

interface ModifierEntrepriseProps {
  show: boolean;
  onHide: () => void;
  entreprise: Entreprise | null;
  onSave: (updatedEntreprise: Entreprise) => void;
}



export default function ModifierEntreprise({ show, onHide, entreprise, onSave }: ModifierEntrepriseProps) {
 const [NomSociete, setNomSociete] = useState("");
   const [EnteteSociete, setEnteteSociete] = useState("");
   const [LogoE, setLogoE] = useState("");
   const [PiedPageSociete, setPiedPageSociete] = useState("");
   const [NCC, setNCC] = useState("");
   const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entreprise) {
      setNomSociete(entreprise?.NomSociete!);
      setEnteteSociete(entreprise?.EnteteSociete!);
      setLogoE(entreprise?.LogoE!);
      setPiedPageSociete(entreprise?.PiedPageSociete!);
      setNCC(entreprise?.NCC!);
    }
  }, [entreprise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entreprise) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/entreprise/${entreprise._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
         NomSociete,
         EnteteSociete,
         LogoE,
         PiedPageSociete,
         NCC
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
        <Modal.Title>Modifier Entreprise</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nom Entreprise</Form.Label>
            <Form.Control value={NomSociete} onChange={(e) => setNomSociete(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Entete</Form.Label>
            <Form.Control value={EnteteSociete} onChange={(e) => setEnteteSociete(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Logo</Form.Label>
            <Form.Control value={LogoE} onChange={(e) => setLogoE(e.target.value)} required />
          </Form.Group>
          <Row>
            <Col className="col-4">
              <Form.Group className="mb-3">
                <Form.Label>Pied de page</Form.Label>
                <Form.Control type="number" value={PiedPageSociete} onChange={(e) => setPiedPageSociete(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col className="col-4">
              <Form.Group className="mb-3">
                <Form.Label>NCC</Form.Label>
                <Form.Control type="number" value={NCC} onChange={(e) => setNCC(e.target.value)} required />
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
