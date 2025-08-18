"use client";

import { Assurance } from "@/types/assurance";
import { Patient } from "@/types/patient";
import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";


interface ModifierPatientProps {
  show: boolean;
  handleClose: () => void;
  patient: Patient | null;
  onUpdate: (updatedPatient: Patient) => void;
}

export default function ModifierPatient({
  show,
  handleClose,
  patient,
  onUpdate,
}: ModifierPatientProps) {
  const [form, setForm] = useState<Partial<Patient>>({});
  const [assurances, setAssurances] = useState<Assurance[]>([]);

  useEffect(() => {
    const fetchAssurances = async () => {
      try {
        const res = await fetch("/api/assurances");
        const data: Assurance[] = await res.json();
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
        nom: patient.nom,
        prenoms: patient.prenoms,
        age: patient.age,
        sexe: patient.sexe,
        contact: patient.contact,
        typevisiteur: patient.typevisiteur,
        assurance: patient.assurance,
        tauxassurance: patient.tauxassurance,
        matriculepatient: patient.matriculepatient,
        dateNaissance: patient.dateNaissance ? new Date(patient.dateNaissance) : undefined,
      });
    }
  }, [patient]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = value === '' ? undefined : Number(value);
    if (name === 'dateNaissance') val = value ? new Date(value) : undefined;

    const key: keyof Patient =
      name === "prenom" ? "prenoms" :
        name === "taux" ? "tauxassurance" :
          name === "matricule" ? "matriculepatient" :
            name as keyof Patient;

    setForm((prev) => {
      let updatedForm: Partial<Patient> = { ...prev, [key]: val };

      if (key === "typevisiteur" && value === "Non Assuré") {
        delete updatedForm.assurance;
        delete updatedForm.tauxassurance;
        delete updatedForm.matriculepatient;
      }

      return updatedForm;
    });
  };

  const validateForm = () => {
    if (!form.nom || !form.prenoms || !form.age || !form.contact) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return false;
    }
    if ((form.typevisiteur === "Mutualiste" || form.typevisiteur === "Préférentiel")) {
      if (!form.assurance || !form.tauxassurance || !form.matriculepatient) {
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

      if (payload.typevisiteur === "Non Assuré") {
        delete payload.assurance;
        delete payload.tauxassurance;
        delete payload.matriculepatient;
      }

      const res = await fetch(`/api/patients/${patient._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated: Patient = await res.json();
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
                  name="nom"
                  value={form.nom || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  name="prenom"
                  value={form.prenoms || ""}
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
                  name="age"
                  value={form.age ?? ''}
                  onChange={handleChange}
                  min={0}
                  required
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
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Contact</Form.Label>
                <Form.Control
                  name="contact"
                  value={form.contact || ''}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date de naissance</Form.Label>
                <Form.Control
                  type="date"
                  name="dateNaissance"
                  value={form.dateNaissance ? new Date(form.dateNaissance).toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Type Visiteur</Form.Label>
                <Form.Select
                  name="typevisiteur"
                  value={form.typevisiteur || ''}
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
          {form.typevisiteur !== "Non Assuré" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Assurance</Form.Label>
                <Form.Select
                  name="assurance"
                  value={form.assurance || ''}
                  onChange={handleChange}
                >
                  <option value="">-- Sélectionner une assurance --</option>
                  {assurances.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.desiganationassurance}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Taux (%)</Form.Label>
                <Form.Control
                  type="number"
                  name="taux"
                  value={form.tauxassurance ?? ''}
                  onChange={handleChange}
                  placeholder="Ex: 80"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Matricule</Form.Label>
                <Form.Control
                  name="matricule"
                  value={form.matriculepatient || ''}
                  onChange={handleChange}
                  placeholder="Numéro matricule"
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
    </Modal>
  );
}
