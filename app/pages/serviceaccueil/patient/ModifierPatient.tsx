'use client';

import { Patient } from '@/types/patient';
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';


type Props = {
  show: boolean;
  onHide: () => void;
  patient: Patient | null;
  onSave: (patient: Patient) => void;
};


export default function ModifierPatient({ show, onHide, patient, onSave }: Props) {
  const [formData, setFormData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(patient);
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    if (!formData) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/patients/${formData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        onSave(updatedPatient);
        onHide();
      } else {
        console.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur réseau', error);
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier Patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Nom</Form.Label>
            <Form.Control name="nom" value={formData.nom} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Prénoms</Form.Label>
            <Form.Control name="prenoms" value={formData.prenoms} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Âge</Form.Label>
            <Form.Control type="number" name="age" value={formData.age} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Sexe</Form.Label>
            <Form.Select name="sexe" value={formData.sexe} onChange={handleChange}>
              <option value="Masculin">Masculin</option>
              <option value="Féminin">Féminin</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Contact</Form.Label>
            <Form.Control name="contact" value={formData.contact} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Code Dossier</Form.Label>
            <Form.Control name="codeDossier" value={formData.codeDossier} disabled />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}


/* 'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

type Patient = {
  id: number;
  nom: string;
  prenoms: string;
  age: number;
  sexe: string;
  contact: string;
  codeDossier: string;
};

type Props = {
  show: boolean;
  onHide: () => void;
  patient: Patient | null;
  onSave: (patient: Patient) => void;
};

export default function ModifierPatient({ show, onHide, patient, onSave }: Props) {
  const [formData, setFormData] = useState<Patient | null>(null);

  useEffect(() => {
    setFormData(patient);
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    if (!formData) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (formData) {
      onSave(formData);
      onHide();
    }
  };

  if (!formData) return null;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier Patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Nom</Form.Label>
            <Form.Control name="nom" value={formData.nom} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Prénoms</Form.Label>
            <Form.Control name="prenoms" value={formData.prenoms} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Âge</Form.Label>
            <Form.Control type="number" name="age" value={formData.age} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Sexe</Form.Label>
            <Form.Select name="sexe" value={formData.sexe} onChange={handleChange}>
              <option value="Masculin">Masculin</option>
              <option value="Féminin">Féminin</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Contact</Form.Label>
            <Form.Control name="contact" value={formData.contact} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Code Dossier</Form.Label>
            <Form.Control name="codeDossier" value={formData.codeDossier} disabled />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
 */