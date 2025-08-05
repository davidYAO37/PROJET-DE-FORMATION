'use client';

import { Patient } from '@/types/patient';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';


type Props = {
  show: boolean;
  onHide: () => void;
  onAdd: (patient: Patient) => void;
  nextId: number;
};


export default function AjouterPatient({ show, onHide, onAdd, nextId }: Props) {
  const [formData, setFormData] = useState<Patient>({
    nom: '',
    prenoms: '',
    age: 0,
    sexe: 'Masculin',
    contact: '',
    codeDossier: `P00${nextId}`,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setFormData({
        nom: '',
        prenoms: '',
        age: 0,
        sexe: 'Masculin',
        contact: '',
        codeDossier: `P00${nextId}`,
      });
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [show, nextId]);

    const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.nom || !formData.prenoms || formData.age <= 0 || !formData.contact) {
      setErrorMsg('Veuillez remplir tous les champs correctement.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPatient = await response.json();
        setSuccessMsg('Patient ajouté avec succès !');
        onAdd(newPatient);
        setTimeout(() => {
          setSuccessMsg(null);
          onHide();
        }, 1500);
      } else {
        setErrorMsg('Erreur lors de l’ajout du patient.');
      }
    } catch (error) {
      setErrorMsg('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter Patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}
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
            <Form.Control value={formData.codeDossier} disabled />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Annuler
        </Button>
        <Button variant="success" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" /> Ajout...
            </>
          ) : (
            'Ajouter'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}



/* 'use client';

import React, { useState, useEffect } from 'react';
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
  onAdd: (patient: Patient) => void;
  nextId: number;
};

export default function AjouterPatient({ show, onHide, onAdd, nextId }: Props) {
  const [formData, setFormData] = useState<Patient>({
    id: nextId,
    nom: '',
    prenoms: '',
    age: 0,
    sexe: 'Masculin',
    contact: '',
    codeDossier: `P00${nextId}`,
  });

  useEffect(() => {
    // Réinitialiser le formulaire à chaque ouverture
    if (show) {
      setFormData({
        id: nextId,
        nom: '',
        prenoms: '',
        age: 0,
        sexe: 'Masculin',
        contact: '',
        codeDossier: `P00${nextId}`,
      });
    }
  }, [show, nextId]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onAdd(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Ajouter Patient</Modal.Title>
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
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button variant="success" onClick={handleSubmit}>
          Ajouter
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
 */