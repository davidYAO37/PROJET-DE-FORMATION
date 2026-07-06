'use client';

import { Medecin } from '@/types/medecin';
import React, { useState } from 'react';
import { Modal, Button, Form, Col, Row } from 'react-bootstrap';

interface AjouterMedecinProps {
  show: boolean;
  onHide: () => void;
  onAdd: (medecin: Medecin) => void;
}



const SPECIALITES = [
  'Médecine Générale',
  'Anesthésiologie',
  'Cardiologie',
  'Chirurgie Générale',
  'Chirurgie Orthopédique',
  'Chirurgie Pédiatrique',
  'Chirurgie Plastique',
  'Chirurgie Thoracique',
  'Chirurgie Vasculaire',
  'Dermatologie',
  'Endocrinologie',
  'Gastro-entérologie',
  'Gériatrie',
  'Gynécologie-Obstétrique',
  'Hématologie',
  'Hépato-gastroentérologie',
  'Infectiologie',
  'Médecine Interne',
  'Médecine d\'Urgence',
  'Médecine du Travail',
  'Médecine Légale',
  'Médecine Nucléaire',
  'Médecine Physique et Réadaptation',
  'Néphrologie',
  'Neurochirurgie',
  'Neurologie',
  'Oncologie',
  'Ophtalmologie',
  'ORL (Oto-Rhino-Laryngologie)',
  'Orthopédie',
  'Pédiatrie',
  'Pneumologie',
  'Psychiatrie',
  'Radiologie',
  'Rhumatologie',
  'Stomatologie',
  'Urologie',
];

export default function AjouterMedecin({ show, onHide, onAdd }: AjouterMedecinProps) {
  const [nom, setNom] = useState('');
  const [prenoms, setPrenoms] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [loading, setLoading] = useState(false);
  const [tauxHonoraire, setTauxHonoraire] = useState('');
  const [tauxPrescription, setTauxPrescription] = useState('');
  const [tauxExecution, setTauxExecution] = useState('');
  const [tauxAideOperatoire, setTauxAideOperatoire] = useState('');
  const [tauxAnesthesiste, setTauxAnesthesiste] = useState('');
  const [emailMed, setEmailMed] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        nom, 
        prenoms, 
        specialite, 
        EmailMed: emailMed,
        TauxHonoraire: Number(tauxHonoraire), 
        TauxPrescription: Number(tauxPrescription), 
        TauxExecution: Number(tauxExecution),
        TauxAideOperatoire: Number(tauxAideOperatoire),
        TauxAnesthesiste: Number(tauxAnesthesiste),
      };
      console.log("Envoi des données médecin:", payload);
      
      const response = await fetch('/api/medecins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newMedecin = await response.json();
        onAdd(newMedecin);
        setNom('');
        setPrenoms('');
        setSpecialite('');
        setTauxHonoraire('');
        setTauxPrescription('');
        setTauxExecution('');
        setTauxAideOperatoire('');
        setTauxAnesthesiste('');
        setEmailMed('');
      }
    } catch (error) {
      console.error('Erreur ajout médecin', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un Médecin</Modal.Title>
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
                <Form.Label>Spécialité</Form.Label>
                <Form.Select value={specialite} onChange={(e) => setSpecialite(e.target.value)} required>
                  <option value="">-- Sélectionner une spécialité --</option>
                  {SPECIALITES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email Médecin</Form.Label>
                <Form.Control value={emailMed} onChange={(e) => setEmailMed(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>
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
                <Form.Label>Taux Exécution</Form.Label>
                <Form.Control type="number" value={tauxExecution} onChange={(e) => setTauxExecution(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col className="col-6">
              <Form.Group className="mb-3">
                <Form.Label>Taux Aide Opératoire</Form.Label>
                <Form.Control type="number" value={tauxAideOperatoire} onChange={(e) => setTauxAideOperatoire(e.target.value)} />
              </Form.Group>
            </Col>
            <Col className="col-6">
              <Form.Group className="mb-3">
                <Form.Label>Taux Anesthésiste</Form.Label>
                <Form.Control type="number" value={tauxAnesthesiste} onChange={(e) => setTauxAnesthesiste(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end">
            <Button variant="secondary" onClick={onHide} className="me-2">Annuler</Button>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Ajout...
                </>
              ) : 'Ajouter'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
