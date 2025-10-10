
"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import SocietePatientModal from "@/components/SocietePatientModal";

interface Assurance {
  _id: string;
  nom: string;
  desiganationassurance?: string;
}

interface ModifierPatientProps {
  show: boolean;
  handleClose: () => void;
  patient: any;
  onUpdate: (updatedPatient: any) => void;
}

export default function ModifierPatientCaisse({ show, handleClose, patient, onUpdate }: ModifierPatientProps) {
  const [form, setForm] = useState<any>({});
  const [assurances, setAssurances] = useState<Assurance[]>([]);

  // Modal société patient
  const [showSocieteModal, setShowSocieteModal] = useState(false);

  // Callback pour sélection société
  const handleSelectSociete = (societe: { _id: string; societe: string }) => {
    setForm((prev: any) => ({ ...prev, SOCIETE_PATIENT: societe.societe }));
  };

  useEffect(() => {
    const fetchAssurances = async () => {
      try {
        const res = await fetch("/api/assurances");
        const data = await res.json();
        setAssurances(data);
      } catch (err) {
        console.error("Erreur lors du chargement des assurances", err);
      }
    };
    fetchAssurances();
  }, []);

  useEffect(() => {
    if (patient) {
      setForm({
        Nom: patient.Nom || '',
        Prenoms: patient.Prenoms || '',
        Age_partient: patient.Age_partient || '',
        sexe: patient.sexe || '',
        Contact: patient.Contact || '',
        TarifPatient: patient.TarifPatient || '',
        IDASSURANCE: patient.IDASSURANCE || '',
        Taux: patient.Taux || '',
        Matricule: patient.Matricule || '',
        Date_naisse: patient.Date_naisse ? new Date(patient.Date_naisse).toISOString().split('T')[0] : '',
        SOCIETE_PATIENT: patient.SOCIETE_PATIENT || '',
        Souscripteur: patient.Souscripteur || '',
      });
    }
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = value === '' ? undefined : Number(value);
    setForm((prev: any) => {
      let updatedForm = { ...prev, [name]: val };
      if (name === "TarifPatient" && value === "Non Assuré") {
        updatedForm.IDASSURANCE = '';
        updatedForm.Taux = '';
        updatedForm.Matricule = '';
        updatedForm.SOCIETE_PATIENT = '';
        updatedForm.Souscripteur = '';
      }
      // Ouvrir le modal si on sélectionne une assurance
      if (name === "IDASSURANCE" && value) {
        setShowSocieteModal(true);
      }
      return updatedForm;
    });
  };

  const validateForm = () => {
    if (!form.Nom || !form.Prenoms || !form.Age_partient || !form.Contact) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return false;
    }
    if ((form.TarifPatient === "Mutualiste" || form.TarifPatient === "Préférentiel")) {
      if (!form.IDASSURANCE || !form.Taux || !form.Matricule) {
        alert("Veuillez renseigner l'assurance, le taux et le matricule.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    if (!validateForm()) return;
    try {
      let payload = { ...form };
      if (payload.TarifPatient === "Non Assuré") {
        payload.IDASSURANCE = undefined;
        payload.Taux = undefined;
        payload.Matricule = '';
        payload.SOCIETE_PATIENT = '';
        payload.Souscripteur = '';
      }
      Object.keys(payload).forEach((k) => {
        if (
          payload[k] === undefined ||
          payload[k] === null ||
          (typeof payload[k] === "string" && payload[k].trim() === "")
        ) {
          delete payload[k];
        }
      });
      const res = await fetch(`/api/patients/${patient._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        handleClose();
      } else {
        console.error("Erreur lors de la mise à jour du patient");
      }
    } catch (err) {
      console.error("Erreur réseau lors de la mise à jour du patient", err);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  name="Nom"
                  value={form.Nom || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  name="Prenoms"
                  value={form.Prenoms || ""}
                  onChange={handleChange}
                  required
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
                  name="Age_partient"
                  value={form.Age_partient ?? ''}
                  onChange={handleChange}
                  min={0}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Date de naissance</Form.Label>
                <Form.Control
                  type="date"
                  name="Date_naisse"
                  value={form.Date_naisse || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sexe</Form.Label>
                <Form.Select
                  name="sexe"
                  value={form.sexe || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                  <option value="Autre">Autre</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact</Form.Label>
                <Form.Control
                  name="Contact"
                  value={form.Contact || ''}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Type Visiteur</Form.Label>
                <Form.Select
                  name="TarifPatient"
                  value={form.TarifPatient || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Non Assuré">Non Assuré</option>
                  <option value="Mutualiste">Mutualiste</option>
                  <option value="Préférentiel">Préférentiel</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          {form.TarifPatient !== "Non Assuré" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Assurance</Form.Label>
                <Form.Select
                  name="IDASSURANCE"
                  value={form.IDASSURANCE || ''}
                  onChange={handleChange}
                >
                  <option value="">-- Sélectionner une assurance --</option>
                  {assurances.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.nom || a.desiganationassurance || ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Taux (%)</Form.Label>
                <Form.Control
                  type="number"
                  name="Taux"
                  value={form.Taux ?? ''}
                  onChange={handleChange}
                  placeholder="Ex: 80"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Matricule</Form.Label>
                <Form.Control
                  name="Matricule"
                  value={form.Matricule || ''}
                  onChange={handleChange}
                  placeholder="Numéro matricule"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Société Patient</Form.Label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Form.Control
                    name="SOCIETE_PATIENT"
                    value={form.SOCIETE_PATIENT || ''}
                    readOnly
                    placeholder="Sélectionner une société"
                    onClick={() => form.IDASSURANCE && setShowSocieteModal(true)}
                    style={{ cursor: form.IDASSURANCE ? 'pointer' : 'not-allowed', background: '#f8f9fa' }}
                  />
                  <Button
                    variant="outline-primary"
                    onClick={() => form.IDASSURANCE && setShowSocieteModal(true)}
                    disabled={!form.IDASSURANCE}
                    title="Choisir une société"
                  >
                    +
                  </Button>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Souscripteur</Form.Label>
                <Form.Control
                  name="Souscripteur"
                  value={form.Souscripteur || ''}
                  onChange={handleChange}
                  placeholder="Nom du souscripteur"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit">
            Enregistrer
          </Button>
        </Modal.Footer>
      </Form>

      {/* Modal Société Patient */}
      <SocietePatientModal
        show={showSocieteModal}
        onHide={() => setShowSocieteModal(false)}
        onSelect={handleSelectSociete}
        assuranceId={form.IDASSURANCE || ""}
      />
    </Modal>
  );
}
