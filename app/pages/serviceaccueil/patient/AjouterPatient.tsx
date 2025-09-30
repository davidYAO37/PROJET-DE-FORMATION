'use client';

import { useState, useEffect } from 'react';
import SocietePatientModal from '@/components/SocietePatientModal';
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
    Nom: '',
    Prenoms: '',
    Age_partient: 0,
    sexe: 'Masculin',
    Contact: '',
    typevisiteur: 'Non Assuré',
    Code_dossier: `P00${nextId}`,
    Matricule: '',
    Date_naisse: '',
    Taux: '',
    IDASSURANCE: '',
    SOCIETE_PATIENT: '',
    Souscripteur: '',
  });

  // Modal société patient
  const [showSocieteModal, setShowSocieteModal] = useState(false);

  // Callback pour sélection société
  const handleSelectSociete = (societe: { _id: string; societe: string }) => {
    setFormData((prev: any) => ({ ...prev, SOCIETE_PATIENT: societe.societe }));
  };

  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Charger les assurances depuis l’API
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
        Nom: '',
        Prenoms: '',
        Age_partient: 0,
        sexe: 'Masculin',
        Contact: '',
        typevisiteur: 'Non Assuré',
        Code_dossier: `P00${nextId}`,
        Matricule: '',
        Date_naisse: '',
        Taux: '',
        IDASSURANCE: '',
        SOCIETE_PATIENT: '',
        Souscripteur: '',
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

      if (name === "Date_naisse" && value) {
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        newData.Age_partient = age > 0 ? age : 0;
      }

      if (name === "Age_partient" && value > 0) {
        const today = new Date();
        const birthYear = today.getFullYear() - parseInt(value, 10);
        const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
        newData.Date_naisse = birthDate.toISOString().split('T')[0];
      }
      // Logique typevisiteur
      if (name === "typevisiteur" && value === "Non Assuré") {
        newData.IDASSURANCE = '';
        newData.Taux = '';
        newData.Matricule = '';
        newData.SOCIETE_PATIENT = '';
      }

      // Ouvre le modal société si on sélectionne une assurance
      if (name === "IDASSURANCE" && value) {
        setShowSocieteModal(true);
      }

      return newData;
    });
  };

  const validateForm = async () => {
    if (!formData.Nom || !formData.Prenoms || formData.Age_partient <= 0 || !formData.Contact) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return false;
    }

    // Vérification unicité Code_dossier côté API
    try {
      const res = await fetch(`/api/patients?Code_dossier=${encodeURIComponent(formData.Code_dossier)}`);
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
      if (!formData.IDASSURANCE || !formData.Taux || !formData.Matricule) {
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
        payload.IDASSURANCE = undefined;
        payload.Taux = undefined;
        payload.Matricule = '';
        payload.SOCIETE_PATIENT = '';
        payload.Souscripteur = '';
      }

      // Nettoyage des champs undefined ou vides
      Object.keys(payload).forEach((k) => {
        if (
          payload[k] === undefined ||
          payload[k] === null ||
          (typeof payload[k] === "string" && payload[k].trim() === "")
        ) {
          delete payload[k];
        }
      });

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
    <>
      <Modal show={show} onHide={onHide} backdrop="static" size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>➕ Ajouter un Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}
          <Form>
            {/* Code Dossier & Type Visiteur */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code Dossier</Form.Label>
                  <Form.Control
                    name="Code_dossier"
                    value={formData.Code_dossier}
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

            {/* Nom & Prénoms */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control
                    name="Nom"
                    value={formData.Nom}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénoms</Form.Label>
                  <Form.Control
                    name="Prenoms"
                    value={formData.Prenoms}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Âge, Date de Naissance, Sexe */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Âge</Form.Label>
                  <Form.Control
                    type="number"
                    name="Age_partient"
                    value={formData.Age_partient}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de Naissance</Form.Label>
                  <Form.Control
                    type="date"
                    name="Date_naisse"
                    value={formData.Date_naisse}
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

            {/* Contact */}
            <Form.Group className="mb-3">
              <Form.Label>Contact</Form.Label>
              <Form.Control
                name="Contact"
                value={formData.Contact}
                onChange={handleChange}
              />
            </Form.Group>

            {/* Assurance + Société + infos complémentaires */}
            {formData.typevisiteur !== 'Non Assuré' && (
              <div className="border p-3 rounded bg-light">
                <Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Assurance</Form.Label>
                    <Form.Select
                      name="IDASSURANCE"
                      value={formData.IDASSURANCE}
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
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Société Patient</Form.Label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Form.Control
                          name="SOCIETE_PATIENT"
                          value={formData.SOCIETE_PATIENT}
                          readOnly
                          placeholder="Sélectionner une société"
                          onClick={() => formData.IDASSURANCE && setShowSocieteModal(true)}
                          style={{ cursor: formData.IDASSURANCE ? 'pointer' : 'not-allowed', background: '#f8f9fa' }}
                        />
                        <Button
                          variant="outline-primary"
                          onClick={() => formData.IDASSURANCE && setShowSocieteModal(true)}
                          disabled={!formData.IDASSURANCE}
                          title="Choisir une société"
                        >
                          +
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Matricule Patient</Form.Label>
                      <Form.Control
                        name="Matricule"
                        value={formData.Matricule}
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
                        name="Taux"
                        value={formData.Taux}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Souscripteur / Adhérent</Form.Label>
                      <Form.Control
                        type="string"
                        name="Souscripteur"
                        value={formData.Souscripteur}
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

      {/* Modal Société Patient */}
      <SocietePatientModal
        show={showSocieteModal}
        onHide={() => setShowSocieteModal(false)}
        assuranceId={formData.IDASSURANCE}   // ✅ correction ici
        onSelect={handleSelectSociete}       // ✅ correction ici
      />
    </>
  );
}