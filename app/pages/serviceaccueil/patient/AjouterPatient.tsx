'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Patient } from '@/types/patient';

type Assurance = {
  _id: string;
  nom: string;
  desiganationassurance?: string;
};

type Props = {
  show: boolean;
  onHide: () => void;
  onAdd: (patient: Patient) => void;
  nextId: number;
};

export default function AjouterPatient({ show, onHide, onAdd, nextId }: Props) {
  const [formData, setFormData] = useState<any>({
    nom: '',
    prenoms: '',
    age: 0,
    sexe: 'Masculin',
    contact: '',
    typevisiteur: 'Non Assuré',
    codeDossier: `P00${nextId}`,
    matriculepatient: '',
    dateNaissance: '',
    tauxassurance: '',
    assurance: '',
  });

  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Charger les assurances depuis l’API existante
  useEffect(() => {
    const fetchAssurances = async () => {
      try {
        const res = await fetch('/api/assurances');
        if (res.ok) {
          const data = await res.json();
          setAssurances(data);
        }
      } catch (err) {
        console.error("Erreur de chargement des assurances", err);
      }
    };
    fetchAssurances();
  }, []);

  // Réinitialiser le formulaire à chaque ouverture
  useEffect(() => {
    if (show) {
      setFormData({
        nom: '',
        prenoms: '',
        age: 0,
        sexe: 'Masculin',
        contact: '',
        typevisiteur: 'Non Assuré',
        codeDossier: `P00${nextId}`,
        matriculepatient: '',
        dateNaissance: '',
        tauxassurance: '',
        assurance: '',
      });
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [show, nextId]);

  // Gestion des champs + logique âge ↔ dateNaissance
  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      let newData = { ...prev, [name]: value };

      if (name === "dateNaissance" && value) {
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        newData.age = age > 0 ? age : 0;
      }

      if (name === "age" && value > 0) {
        const today = new Date();
        const birthYear = today.getFullYear() - parseInt(value, 10);
        const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
        newData.dateNaissance = birthDate.toISOString().split('T')[0];
      }

      if (name === "typevisiteur" && value === "Non Assuré") {
        newData.assurance = '';
        newData.tauxassurance = '';
        newData.matriculepatient = '';
      }

      return newData;
    });
  };

  const validateForm = async () => {
    if (!formData.nom || !formData.prenoms || formData.age <= 0 || !formData.contact) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return false;
    }
    // Vérification unicité codeDossier côté API
    try {
      const res = await fetch(`/api/patients?codeDossier=${encodeURIComponent(formData.codeDossier)}`);
      if (res.ok) {
        const patients = await res.json();
        if (Array.isArray(patients) && patients.length > 0) {
          setErrorMsg('Ce code dossier existe déjà. Veuillez en choisir un autre.');
          return false;
        }
      }
    } catch { }
    // Vérification des champs pour Mutualiste et Préférentiel
    if ((formData.typevisiteur === "Mutualiste" || formData.typevisiteur === "Préférentiel")) {
      if (!formData.assurance || !formData.tauxassurance || !formData.matriculepatient) {
        setErrorMsg("Veuillez renseigner l'assurance, le taux et le matricule.");
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const isValid = await validateForm();
    if (!isValid) {
      setLoading(false);
      return;
    }
    try {
      let payload = { ...formData };

      if (payload.typevisiteur === "Non Assuré") {
        delete payload.assurance;
        delete payload.tauxassurance;
        delete payload.matriculepatient;
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newPatient = await response.json();
        setSuccessMsg('✅ Patient ajouté avec succès !');
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
    <Modal show={show} onHide={onHide} backdrop="static" size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>➕ Ajouter un Patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Code Dossier</Form.Label>
                <Form.Control
                  name="codeDossier"
                  value={formData.codeDossier}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Type Visiteur</Form.Label>
                <Form.Select
                  name="typevisiteur"
                  value={formData.typevisiteur}
                  onChange={handleChange}
                >
                  <option value="Non Assuré">Non Assuré</option>
                  <option value="Mutualiste">Mutualiste</option>
                  <option value="Préférentiel">Préférentiel</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénoms</Form.Label>
                <Form.Control
                  name="prenoms"
                  value={formData.prenoms}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Âge</Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Date de Naissance</Form.Label>
                <Form.Control
                  type="date"
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sexe</Form.Label>
                <Form.Select
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                >
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Contact</Form.Label>
            <Form.Control
              name="contact"
              value={formData.contact}
              onChange={handleChange}
            />
          </Form.Group>
          {formData.typevisiteur !== 'Non Assuré' && (
            <div className="border p-3 rounded bg-light">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Assurance</Form.Label>
                    <Form.Select
                      name="assurance"
                      value={formData.assurance}
                      onChange={handleChange}
                    >
                      <option value="">-- Sélectionner --</option>
                      {assurances.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.nom || a.desiganationassurance || ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Matricule Patient</Form.Label>
                    <Form.Control
                      name="matriculepatient"
                      value={formData.matriculepatient}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Taux Assurance (%)</Form.Label>
                    <Form.Control
                      type="number"
                      name="tauxassurance"
                      value={formData.tauxassurance}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Annuler
        </Button>
        <Button variant="success" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" /> Enregistrement...
            </>
          ) : (
            'Ajouter'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
