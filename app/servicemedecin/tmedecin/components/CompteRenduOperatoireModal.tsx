"use client";
import { useState, useEffect, FormEvent } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Table,
  Button,
  Form,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  FaStethoscope,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPrint,
  FaFileAlt,
} from "react-icons/fa";
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from "@/utils/printRecu";
import { COMPTE_RENDU_OPERATOIRE_TYPES, COMPTE_RENDU_OPERATOIRE_STATUTS, TypeCompteRenduOperatoire, StatutCompteRenduOperatoire, COMPTE_RENDU_OPERATOIRE_LABELS } from "@/types/compteRenduOperatoire";

interface CompteRenduOperatoire {
  _id: string;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateOperation: Date;
  heureDebut?: string;
  heureFin?: string;
  chirurgien: string;
  assistant?: string;
  anesthesiste?: string;
  infirmier?: string;
  typeOperation: TypeCompteRenduOperatoire;
  descriptionOperation: string;
  diagnosticPreOperatoire: string;
  gestesRealises: string;
  complications?: string;
  suitesOperatoires: string;
  traitementPostOperatoire?: string;
  dureeOperation?: number;
  statut: StatutCompteRenduOperatoire;
  numeroDossier: string;
  dateCreation: Date;
  medecinId?: string;
  entrepriseId?: string;
  observations?: string;
}

interface CompteRenduOperatoireModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  patientCodeDossier?: string;
}

export default function CompteRenduOperatoireModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
  patientCodeDossier
}: CompteRenduOperatoireModalProps) {
  const [comptesRendus, setComptesRendus] = useState<CompteRenduOperatoire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCR, setEditingCR] = useState<CompteRenduOperatoire | null>(null);
  const currentUser = localStorage.getItem("nom_utilisateur") || localStorage.getItem("userName") || "";
  const { entreprise } = useEntreprise();

  const [formData, setFormData] = useState({
    dateOperation: "",
    heureDebut: "",
    heureFin: "",
    chirurgien: currentUser,
    assistant: "",
    anesthesiste: "",
    infirmier: "",
    typeOperation: "chirurgie_generale" as TypeCompteRenduOperatoire,
    descriptionOperation: "",
    diagnosticPreOperatoire: "",
    gestesRealises: "",
    complications: "",
    suitesOperatoires: "",
    traitementPostOperatoire: "",
    statut: "planifie" as StatutCompteRenduOperatoire,
    numeroDossier: "",
    observations: "",
    dureeOperation: 0
  });

  const canManageCR = (cr: CompteRenduOperatoire) => {
    return cr.chirurgien?.trim() === currentUser?.trim() && cr.statut !== "termine";
  };

  // Charger les comptes rendus opératoires du patient
  useEffect(() => {
    const chargerCR = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/compterenduoperatoire?patientId=${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setComptesRendus(data.data || []);
        } else {
          setComptesRendus([]);
        }
      } catch (err: any) {
        setError(err.message);
        setComptesRendus([]);
      } finally {
        setLoading(false);
      }
    };

    if (show && patientId) {
      chargerCR();
    }
  }, [show, patientId]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      dateOperation: "",
      heureDebut: "",
      heureFin: "",
      chirurgien: currentUser,
      assistant: "",
      anesthesiste: "",
      infirmier: "",
      typeOperation: "chirurgie_generale",
      descriptionOperation: "",
      diagnosticPreOperatoire: "",
      gestesRealises: "",
      complications: "",
      suitesOperatoires: "",
      traitementPostOperatoire: "",
      statut: "planifie",
      numeroDossier: "",
      observations: "",
      dureeOperation: 0
    });
    setEditingCR(null);
  };

  // Ouvrir le modal d'ajout
  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (cr: CompteRenduOperatoire) => {
    setFormData({
      dateOperation: new Date(cr.dateOperation).toISOString().split("T")[0],
      heureDebut: cr.heureDebut || "",
      heureFin: cr.heureFin || "",
      chirurgien: cr.chirurgien || currentUser || "",
      assistant: cr.assistant || "",
      anesthesiste: cr.anesthesiste || "",
      infirmier: cr.infirmier || "",
      typeOperation: cr.typeOperation || "chirurgie_generale",
      descriptionOperation: cr.descriptionOperation,
      diagnosticPreOperatoire: cr.diagnosticPreOperatoire,
      gestesRealises: cr.gestesRealises,
      complications: cr.complications || "",
      suitesOperatoires: cr.suitesOperatoires,
      traitementPostOperatoire: cr.traitementPostOperatoire || "",
      statut: cr.statut,
      numeroDossier: cr.numeroDossier,
      observations: cr.observations || "",
      dureeOperation: cr.dureeOperation || 0
    });
    setEditingCR(cr);
    setShowAddModal(true);
  };

  // Sauvegarder le compte rendu opératoire
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCR
        ? `/api/compterenduoperatoire/${editingCR._id}`
        : "/api/compterenduoperatoire";

      const method = editingCR ? "PUT" : "POST";

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const operationDate = new Date(formData.dateOperation);
      operationDate.setHours(0, 0, 0, 0);

      if (!editingCR && operationDate < today) {
        setError("La date d'opération ne peut pas être antérieure à aujourd'hui");
        return;
      }

      if (editingCR) {
        const originalDate = new Date(editingCR.dateOperation);
        originalDate.setHours(0, 0, 0, 0);
        if (operationDate < today && operationDate.getTime() !== originalDate.getTime()) {
          setError("La date d'opération ne peut pas être antérieure à aujourd'hui");
          return;
        }
      }

      let numeroDossier = editingCR?.numeroDossier;
      if (!numeroDossier && patientCodeDossier) {
        const count = comptesRendus.length + 1;
        numeroDossier = `${patientCodeDossier}-CR-${count}`;
      } else if (!numeroDossier) {
        numeroDossier = `CR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }

      const payload = {
        ...formData,
        patientId,
        patientNom,
        patientPrenoms,
        numeroDossier,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-name": currentUser,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      setSuccess(result.message || (editingCR ? "Compte rendu modifié avec succès" : "Compte rendu ajouté avec succès"));
      setTimeout(() => setSuccess(""), 3000);

      // Recharger la liste
      const crResponse = await fetch(`/api/compterenduoperatoire?patientId=${patientId}`);
      if (crResponse.ok) {
        const data = await crResponse.json();
        setComptesRendus(data.data || []);
      }

      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Supprimer un compte rendu opératoire
  const handleDelete = async (crId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte rendu opératoire ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/compterenduoperatoire/${crId}`, {
        method: "DELETE",
        headers: {
          "x-user-name": currentUser,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression");
      }

      setSuccess(result.message || "Compte rendu supprimé avec succès");
      setTimeout(() => setSuccess(""), 3000);

      setComptesRendus(comptesRendus.filter(cr => cr._id !== crId));
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Générer le contenu HTML du compte rendu opératoire
  const getCompteRenduPrintContent = (cr: CompteRenduOperatoire) => {
    const typeLibelle = COMPTE_RENDU_OPERATOIRE_LABELS[cr.typeOperation] || "Opération";
    const patientFullName = `${cr.patientNom || ""} ${cr.patientPrenoms || ""}`.trim() || "Patient non renseigné";
    const dateOperation = new Date(cr.dateOperation).toLocaleDateString("fr-FR");
    const dateCreation = new Date(cr.dateCreation).toLocaleDateString("fr-FR");
    const duree = cr.dureeOperation ? `${Math.floor(cr.dureeOperation / 60)}h${cr.dureeOperation % 60}min` : "Non spécifiée";

    return `
      <div class="print-area" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #000;">
        <div style="text-align: center; border-bottom: 3px double #007bff; padding-bottom: 20px; margin-bottom: 30px;">
          <h2>COMPTE RENDU OPÉRATOIRE</h2>
          <p>Patient: ${patientFullName}</p>
          <p>Date: ${dateOperation}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="display: flex;"><span style="font-weight: bold; width: 150px;">Chirurgien:</span><span>${cr.chirurgien || "N/A"}</span></div>
          <div style="display: flex;"><span style="font-weight: bold; width: 150px;">Type d'opération:</span><span>${typeLibelle}</span></div>
          <div style="display: flex;"><span style="font-weight: bold; width: 150px;">Heure début:</span><span>${cr.heureDebut || "N/A"}</span></div>
          <div style="display: flex;"><span style="font-weight: bold; width: 150px;">Heure fin:</span><span>${cr.heureFin || "N/A"}</span></div>
          <div style="display: flex;"><span style="font-weight: bold; width: 150px;">Durée:</span><span>${duree}</span></div>
          <div style="display: flex;"><span style="font-weight: bold; width: 150px;">Statut:</span><span>${cr.statut}</span></div>
        </div>

        ${cr.assistant ? `<div style="margin-bottom: 10px; display: flex;"><span style="font-weight: bold; width: 150px;">Assistant:</span><span>${cr.assistant}</span></div>` : ""}
        ${cr.anesthesiste ? `<div style="margin-bottom: 10px; display: flex;"><span style="font-weight: bold; width: 150px;">Anesthésiste:</span><span>${cr.anesthesiste}</span></div>` : ""}
        ${cr.infirmier ? `<div style="margin-bottom: 10px; display: flex;"><span style="font-weight: bold; width: 150px;">Infirmier:</span><span>${cr.infirmier}</span></div>` : ""}

        <div style="margin-bottom: 25px;"><div style="font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px;">DIAGNOSTIC PRÉ-OPÉRATOIRE</div><p>${cr.diagnosticPreOperatoire || "Non spécifié"}</p></div>
        <div style="margin-bottom: 25px;"><div style="font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px;">DESCRIPTION DE L'OPÉRATION</div><p style="white-space: pre-line;">${cr.descriptionOperation || "Non spécifié"}</p></div>
        <div style="margin-bottom: 25px;"><div style="font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px;">GESTES RÉALISÉS</div><p style="white-space: pre-line;">${cr.gestesRealises || "Non spécifié"}</p></div>
        ${cr.complications ? `<div style="margin-bottom: 25px;"><div style="font-weight: bold; color: #dc3545; margin-bottom: 10px; font-size: 16px;">COMPLICATIONS</div><p style="white-space: pre-line;">${cr.complications}</p></div>` : ""}
        <div style="margin-bottom: 25px;"><div style="font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px;">SUITES OPÉRATOIRES</div><p style="white-space: pre-line;">${cr.suitesOperatoires || "Non spécifié"}</p></div>
        ${cr.traitementPostOperatoire ? `<div style="margin-bottom: 25px;"><div style="font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px;">TRAITEMENT POST-OPÉRATOIRE</div><p style="white-space: pre-line;">${cr.traitementPostOperatoire}</p></div>` : ""}
        ${cr.observations ? `<div style="margin-bottom: 25px;"><div style="font-weight: bold; color: #007bff; margin-bottom: 10px; font-size: 16px;">OBSERVATIONS</div><p style="white-space: pre-line;">${cr.observations}</p></div>` : ""}

        <div style="text-align: center; margin-top: 50px; font-style: italic;">
          <p>Fait le ${dateCreation}</p>
          <p>Document généré par le système de gestion médicale</p>
        </div>
      </div>
    `;
  };

  // Imprimer avec en-tête
  const handlePrintWithHeader = (cr: CompteRenduOperatoire) => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    const contentHTML = getCompteRenduPrintContent(cr);
    createPrintWindow('Compte Rendu Opératoire', headerHTML, contentHTML, footerHTML);
  };

  // Imprimer sans en-tête
  const handlePrintWithoutHeader = (cr: CompteRenduOperatoire) => {
    const contentHTML = getCompteRenduPrintContent(cr);
    createPrintWindowWithoutHeader('Compte Rendu Opératoire', contentHTML);
  };

  const getTypeLibelle = (type: TypeCompteRenduOperatoire) => {
    return COMPTE_RENDU_OPERATOIRE_LABELS[type] || "Opération";
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "planifie": return "secondary";
      case "en_cours": return "warning";
      case "termine": return "success";
      case "annule": return "danger";
      default: return "secondary";
    }
  };

  const getStatutLibelle = (statut: string) => {
    switch (statut) {
      case "planifie": return "Planifié";
      case "en_cours": return "En cours";
      case "termine": return "Terminé";
      case "annule": return "Annulé";
      default: return statut;
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-info text-dark">
          <Modal.Title className="d-flex align-items-center">
            <FaStethoscope className="me-2" />
            Gestion des Comptes Rendus Opératoires
            <Badge bg="info" className="ms-2">{comptesRendus.length}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">
              Patient: {patientNom} {patientPrenoms}
            </h5>
            <Button variant="primary" onClick={handleAdd}>
              <FaPlus className="me-2" />
              Nouveau CR Opératoire
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : comptesRendus.length > 0 ? (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>N° Dossier</th>
                  <th>Date Opération</th>
                  <th>Type</th>
                  <th>Chirurgien</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptesRendus.map((cr) => (
                  <tr key={cr._id}>
                    <td className="fw-bold">{cr.numeroDossier}</td>
                    <td>{new Date(cr.dateOperation).toLocaleDateString("fr-FR")}</td>
                    <td>{getTypeLibelle(cr.typeOperation)}</td>
                    <td>{cr.chirurgien}</td>
                    <td>
                      <Badge bg={getStatutBadge(cr.statut)}>
                        {getStatutLibelle(cr.statut)}
                      </Badge>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(cr)}
                          title="Modifier"
                          disabled={!canManageCR(cr)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handlePrintWithHeader(cr)}
                          title="Imprimer avec en-tête"
                        >
                          <FaPrint />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handlePrintWithoutHeader(cr)}
                          title="Imprimer sans en-tête"
                        >
                          <FaFileAlt />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(cr._id)}
                          title="Supprimer"
                          disabled={!canManageCR(cr)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <FaStethoscope className="text-muted fs-1 mb-3" />
              <p className="text-muted">Aucun compte rendu opératoire trouvé</p>
              <Button variant="primary" onClick={handleAdd}>
                <FaPlus className="me-2" />
                Créer le premier compte rendu opératoire
              </Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Ajout/Modification */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCR ? "Modifier le Compte Rendu Opératoire" : "Nouveau Compte Rendu Opératoire"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSave}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date d'opération *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateOperation}
                    onChange={(e) => setFormData({ ...formData, dateOperation: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure début</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.heureDebut}
                    onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure fin</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.heureFin}
                    onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chirurgien *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.chirurgien}
                    onChange={(e) => setFormData({ ...formData, chirurgien: e.target.value })}
                    placeholder="Nom du chirurgien..."
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type d'opération *</Form.Label>
                  <Form.Select
                    value={formData.typeOperation}
                    onChange={(e) => setFormData({ ...formData, typeOperation: e.target.value as TypeCompteRenduOperatoire })}
                    required
                  >
                    {COMPTE_RENDU_OPERATOIRE_TYPES.map(type => (
                      <option key={type} value={type}>{COMPTE_RENDU_OPERATOIRE_LABELS[type]}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Assistant</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.assistant}
                    onChange={(e) => setFormData({ ...formData, assistant: e.target.value })}
                    placeholder="Assistant chirurgical..."
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Anesthésiste</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.anesthesiste}
                    onChange={(e) => setFormData({ ...formData, anesthesiste: e.target.value })}
                    placeholder="Anesthésiste..."
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Infirmier</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.infirmier}
                    onChange={(e) => setFormData({ ...formData, infirmier: e.target.value })}
                    placeholder="Infirmier..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Diagnostic pré-opératoire *</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.diagnosticPreOperatoire}
                onChange={(e) => setFormData({ ...formData, diagnosticPreOperatoire: e.target.value })}
                placeholder="Diagnostic avant l'opération..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description de l'opération *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.descriptionOperation}
                onChange={(e) => setFormData({ ...formData, descriptionOperation: e.target.value })}
                placeholder="Description détaillée de l'opération..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Gestes réalisés *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.gestesRealises}
                onChange={(e) => setFormData({ ...formData, gestesRealises: e.target.value })}
                placeholder="Gestes chirurgicaux effectués..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Complications</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.complications}
                onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                placeholder="Complications survenues (si applicable)..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Suites opératoires *</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.suitesOperatoires}
                onChange={(e) => setFormData({ ...formData, suitesOperatoires: e.target.value })}
                placeholder="Suites et évolution post-opératoire..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Traitement post-opératoire</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.traitementPostOperatoire}
                onChange={(e) => setFormData({ ...formData, traitementPostOperatoire: e.target.value })}
                placeholder="Traitement prescrit après l'opération..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as StatutCompteRenduOperatoire })}
              >
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observations</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observations supplémentaires..."
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                {editingCR ? "Modifier" : "Créer"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
