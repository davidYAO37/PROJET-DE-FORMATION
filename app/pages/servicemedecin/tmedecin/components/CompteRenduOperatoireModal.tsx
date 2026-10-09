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
import { TypeCompteRenduOperatoire, StatutCompteRenduOperatoire, COMPTE_RENDU_OPERATOIRE_LABELS, normalizeCompteRenduOperatoireStatut } from "@/types/compteRenduOperatoire";

interface CompteRenduOperatoire {
  _id: string;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  dateOperation: Date;
  heureDebut?: string;
  heureFin?: string;
  chirurgien: string;
  sexe?: string;
  age?: number;
  assistant?: string;
  anesthesiste?: string;
  indication?: string;
  intervention?: string;
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
  validatedAt?: Date;
  validatedBy?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  motifAnnulation?: string;
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
  patientSexe?: string;
  patientAge?: number;
  patientCodeDossier?: string;
}

export default function CompteRenduOperatoireModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
  patientSexe,
  patientAge,
  patientCodeDossier
}: CompteRenduOperatoireModalProps) {
  const [comptesRendus, setComptesRendus] = useState<CompteRenduOperatoire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCR, setEditingCR] = useState<CompteRenduOperatoire | null>(null);
  const [statutFilter, setStatutFilter] = useState<"" | "brouillon" | "a_valider" | "valide" | "annule">("");
  const [medecinFilter, setMedecinFilter] = useState("");
  const currentUser = localStorage.getItem("nom_utilisateur") || localStorage.getItem("userName") || "";
  const { entreprise } = useEntreprise();

  const [formData, setFormData] = useState({
    dateOperation: "",
    chirurgien: currentUser,
    assistant: "",
    anesthesiste: "",
    indication: "",
    diagnosticPreOperatoire: "",
    intervention: "",
  });

  const canManageCR = (cr: CompteRenduOperatoire) => {
    const statut = normalizeCompteRenduOperatoireStatut(cr.statut);
    return cr.chirurgien?.trim() === currentUser?.trim() && (statut === "brouillon" || statut === "a_valider");
  };

  const medecins = [...new Set(comptesRendus.map(cr => cr.chirurgien).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const comptesRendusFiltres = comptesRendus.filter(cr =>
    (!statutFilter || normalizeCompteRenduOperatoireStatut(cr.statut) === statutFilter) &&
    (!medecinFilter || cr.chirurgien === medecinFilter)
  );

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
      setStatutFilter("");
      setMedecinFilter("");
      chargerCR();
    }
  }, [show, patientId]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      dateOperation: "",
      chirurgien: currentUser,
      assistant: "",
      anesthesiste: "",
      indication: "",
      diagnosticPreOperatoire: "",
      intervention: "",
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
      chirurgien: cr.chirurgien || currentUser || "",
      assistant: cr.assistant || "",
      anesthesiste: cr.anesthesiste || "",
      indication: cr.indication || "",
      diagnosticPreOperatoire: cr.diagnosticPreOperatoire || "",
      intervention: cr.intervention || cr.descriptionOperation || "",
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

      const numeroDossier = patientCodeDossier || editingCR?.numeroDossier;

      const payload = {
        ...formData,
        sexe: patientSexe,
        age: patientAge,
        patientId,
        patientNom,
        patientPrenoms,
        numeroDossier,
        typeOperation: "autre" as TypeCompteRenduOperatoire,
        descriptionOperation: formData.intervention,
        gestesRealises: formData.intervention,
        suitesOperatoires: "Non renseignées",
        statut: editingCR?.statut || "brouillon",
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

  const handleStatusChange = async (cr: CompteRenduOperatoire, statut: "a_valider" | "valide" | "annule") => {
    const motifAnnulation = statut === "annule" ? prompt("Indiquez le motif de l’annulation :")?.trim() : undefined;
    if (statut === "annule" && !motifAnnulation) return;
    if (statut === "valide" && !confirm("Valider définitivement ce compte rendu ? Il ne pourra plus être modifié.")) return;

    try {
      const response = await fetch(`/api/compterenduoperatoire/${cr._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": currentUser,
        },
        body: JSON.stringify({ statut, motifAnnulation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur lors du changement de statut");

      setComptesRendus(current => current.map(item => item._id === cr._id ? result.data : item));
      setSuccess(result.message || "Statut mis à jour avec succès");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Générer le contenu HTML du compte rendu opératoire
  const getCompteRenduPrintContent = (cr: CompteRenduOperatoire) => {
    const escapeHtml = (value?: string | number) => String(value ?? "Non renseigné")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    const patientFullName = `${cr.patientNom || ""} ${cr.patientPrenoms || ""}`.trim() || "Non renseigné";
    const dateOperation = new Date(cr.dateOperation).toLocaleDateString("fr-FR");
    const intervention = cr.intervention || cr.descriptionOperation || cr.gestesRealises;
    const text = (value?: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");
    const statut = normalizeCompteRenduOperatoireStatut(cr.statut);
    const statutLabel = statut === "brouillon" ? "BROUILLON" : statut === "a_valider" ? "À VALIDER" : statut === "annule" ? "ANNULÉ" : "";

    return `
      <div class="print-area" style="font-family: 'Segoe UI', Arial, sans-serif; padding: 10px 20px; line-height: 1.55; color: #1f2937; font-size: 13px; position: relative;">
        ${statutLabel ? `<div style="position: fixed; top: 45%; left: 16%; transform: rotate(-28deg); font-size: 72px; font-weight: 800; letter-spacing: 8px; color: ${statut === "annule" ? "rgba(185, 28, 28, .12)" : "rgba(71, 85, 105, .12)"}; z-index: 0; pointer-events: none;">${statutLabel}</div>` : ""}
        <div style="position: relative; z-index: 1;">
        <div style="border-bottom: 3px solid #0f766e; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #0f766e; letter-spacing: 1.8px; text-transform: uppercase;">Document médical</div>
            <div style="font-size: 25px; line-height: 1.2; font-weight: 750; color: #111827; margin-top: 4px;">Compte rendu opératoire</div>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 7px 12px; text-align: right;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .7px;">Date de l'intervention</div>
            <div style="font-size: 14px; font-weight: 700; color: #065f46;">${escapeHtml(dateOperation)}</div>
            ${statut === "valide" ? `<div style="font-size: 9px; font-weight: 800; color: #047857; margin-top: 3px; letter-spacing: .6px;">DOCUMENT VALIDÉ</div>` : ""}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #dbe3ea; border-left: 4px solid #0f766e; border-radius: 7px; padding: 14px 16px; margin-bottom: 18px; page-break-inside: avoid;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">Identification du patient</div>
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
            <tbody>
              <tr>
                <td style="width: 55%; padding: 3px 12px 7px 0; vertical-align: top;">
                  <div style="font-size: 10px; color: #64748b;">Nom et prénom</div>
                  <div style="font-size: 15px; font-weight: 700; color: #111827;">${escapeHtml(patientFullName)}</div>
                </td>
                <td style="width: 20%; padding: 3px 12px 7px 0; vertical-align: top;">
                  <div style="font-size: 10px; color: #64748b;">Sexe</div>
                  <div style="font-weight: 650;">${escapeHtml(cr.sexe)}</div>
                </td>
                <td style="width: 25%; padding: 3px 0 7px; vertical-align: top;">
                  <div style="font-size: 10px; color: #64748b;">Âge</div>
                  <div style="font-weight: 650;">${cr.age !== undefined ? `${escapeHtml(cr.age)} ans` : "Non renseigné"}</div>
                </td>
              </tr>
              <tr>
                <td colspan="3" style="border-top: 1px solid #e2e8f0; padding-top: 8px;">
                  <span style="font-size: 10px; color: #64748b; margin-right: 8px;">N° DOSSIER</span>
                  <span style="font-family: Consolas, monospace; font-size: 14px; font-weight: 700; color: #0f766e;">${escapeHtml(cr.numeroDossier)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #dbe3ea; border-radius: 7px; overflow: hidden; margin-bottom: 20px; page-break-inside: avoid;">
          <tbody>
            <tr>
              <td style="width: 28%; background: #f1f5f9; padding: 8px 12px; font-weight: 700; color: #334155;">Chirurgien</td>
              <td style="padding: 8px 12px;">${escapeHtml(cr.chirurgien)}</td>
            </tr>
            <tr>
              <td style="background: #f1f5f9; padding: 8px 12px; font-weight: 700; color: #334155; border-top: 1px solid #dbe3ea;">Aide(s)</td>
              <td style="padding: 8px 12px; border-top: 1px solid #dbe3ea;">${escapeHtml(cr.assistant)}</td>
            </tr>
            <tr>
              <td style="background: #f1f5f9; padding: 8px 12px; font-weight: 700; color: #334155; border-top: 1px solid #dbe3ea;">Anesthésiste</td>
              <td style="padding: 8px 12px; border-top: 1px solid #dbe3ea;">${escapeHtml(cr.anesthesiste)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-bottom: 16px; page-break-inside: avoid;">
          <div style="font-size: 12px; font-weight: 750; color: #0f766e; text-transform: uppercase; letter-spacing: .7px; border-bottom: 1px solid #99f6e4; padding-bottom: 4px; margin-bottom: 7px;">Indication opératoire</div>
          <div style="min-height: 38px; text-align: justify;">${text(cr.indication)}</div>
        </div>

        <div style="margin-bottom: 16px; page-break-inside: avoid;">
          <div style="font-size: 12px; font-weight: 750; color: #0f766e; text-transform: uppercase; letter-spacing: .7px; border-bottom: 1px solid #99f6e4; padding-bottom: 4px; margin-bottom: 7px;">Diagnostic préopératoire</div>
          <div style="min-height: 38px; text-align: justify;">${text(cr.diagnosticPreOperatoire)}</div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 750; color: #0f766e; text-transform: uppercase; letter-spacing: .7px; border-bottom: 1px solid #99f6e4; padding-bottom: 4px; margin-bottom: 7px;">Protocole opératoire / Intervention</div>
          <div style="min-height: 170px; text-align: justify;">${text(intervention)}</div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 34px; page-break-inside: avoid;">
          <div style="width: 230px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 8px;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .7px;">Signature et cachet</div>
            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-top: 18px;">${escapeHtml(cr.chirurgien)}</div>
          </div>
        </div>
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

  const getStatutBadge = (statut: StatutCompteRenduOperatoire) => {
    switch (normalizeCompteRenduOperatoireStatut(statut)) {
      case "brouillon": return "secondary";
      case "a_valider": return "warning";
      case "valide": return "success";
      case "annule": return "danger";
    }
  };

  const getStatutLibelle = (statut: StatutCompteRenduOperatoire) => {
    switch (normalizeCompteRenduOperatoireStatut(statut)) {
      case "brouillon": return "Brouillon";
      case "a_valider": return "À valider";
      case "valide": return "Validé";
      case "annule": return "Annulé";
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-info text-dark">
          <Modal.Title className="d-flex align-items-center">
            <FaStethoscope className="me-2" />
            Gestion des Comptes Rendus Opératoires
            <Badge bg="info" className="ms-2">{comptesRendusFiltres.length}/{comptesRendus.length}</Badge>
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

          {comptesRendus.length > 0 && (
            <Card className="border-0 bg-light mb-3">
              <Card.Body className="py-3">
                <Row className="g-3 align-items-end">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold mb-1">Filtrer par statut</Form.Label>
                      <Form.Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value as typeof statutFilter)}>
                        <option value="">Tous les statuts</option>
                        <option value="brouillon">Brouillon</option>
                        <option value="a_valider">À valider</option>
                        <option value="valide">Validé</option>
                        <option value="annule">Annulé</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold mb-1">Filtrer par médecin</Form.Label>
                      <Form.Select value={medecinFilter} onChange={(e) => setMedecinFilter(e.target.value)}>
                        <option value="">Tous les médecins</option>
                        {medecins.map(medecin => <option key={medecin} value={medecin}>{medecin}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Button variant="outline-secondary" className="w-100" onClick={() => { setStatutFilter(""); setMedecinFilter(""); }} disabled={!statutFilter && !medecinFilter}>
                      Réinitialiser
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : comptesRendusFiltres.length > 0 ? (
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
                {comptesRendusFiltres.map((cr) => (
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
                        {normalizeCompteRenduOperatoireStatut(cr.statut) === "brouillon" && canManageCR(cr) && (
                          <Button variant="outline-warning" size="sm" onClick={() => handleStatusChange(cr, "a_valider")} title="Soumettre à validation">
                            Soumettre
                          </Button>
                        )}
                        {normalizeCompteRenduOperatoireStatut(cr.statut) === "a_valider" && canManageCR(cr) && (
                          <Button variant="outline-success" size="sm" onClick={() => handleStatusChange(cr, "valide")} title="Valider définitivement">
                            Valider
                          </Button>
                        )}
                        {(normalizeCompteRenduOperatoireStatut(cr.statut) === "brouillon" || normalizeCompteRenduOperatoireStatut(cr.statut) === "a_valider") && canManageCR(cr) && (
                          <Button variant="outline-danger" size="sm" onClick={() => handleStatusChange(cr, "annule")} title="Annuler le compte rendu">
                            Annuler
                          </Button>
                        )}
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handlePrintWithHeader(cr)}
                          title={normalizeCompteRenduOperatoireStatut(cr.statut) === "valide" ? "Imprimer l’état officiel avec en-tête" : "Imprimer avec filigrane"}
                        >
                          <FaPrint />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handlePrintWithoutHeader(cr)}
                          title={normalizeCompteRenduOperatoireStatut(cr.statut) === "valide" ? "Imprimer l’état officiel sans en-tête" : "Imprimer sans en-tête avec filigrane"}
                        >
                          <FaFileAlt />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(cr._id)}
                          title="Supprimer"
                          disabled={!canManageCR(cr) || normalizeCompteRenduOperatoireStatut(cr.statut) !== "brouillon"}
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
              <p className="text-muted">
                {comptesRendus.length > 0 ? "Aucun compte rendu ne correspond aux filtres sélectionnés" : "Aucun compte rendu opératoire trouvé"}
              </p>
              {comptesRendus.length === 0 && (
                <Button variant="primary" onClick={handleAdd}>
                  <FaPlus className="me-2" />
                  Créer le premier compte rendu opératoire
                </Button>
              )}
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
            <Card className="border-0 bg-light mb-3">
              <Card.Body>
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Nom et prénom du patient</Form.Label>
                      <Form.Control value={`${patientNom || ""} ${patientPrenoms || ""}`.trim()} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Date *</Form.Label>
                      <Form.Control type="date" value={formData.dateOperation} onChange={(e) => setFormData({ ...formData, dateOperation: e.target.value })} required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Sexe</Form.Label>
                      <Form.Control value={patientSexe || "Non renseigné"} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Âge</Form.Label>
                      <Form.Control value={patientAge !== undefined ? `${patientAge} ans` : "Non renseigné"} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>N° dossier</Form.Label>
                      <Form.Control value={patientCodeDossier || editingCR?.numeroDossier || "Non renseigné"} readOnly />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Form.Group className="mb-3">
              <Form.Label>Chirurgien *</Form.Label>
              <Form.Control value={formData.chirurgien} onChange={(e) => setFormData({ ...formData, chirurgien: e.target.value })} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Aide(s)</Form.Label>
              <Form.Control value={formData.assistant} onChange={(e) => setFormData({ ...formData, assistant: e.target.value })} placeholder="Noms des aides opératoires" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Anesthésiste</Form.Label>
              <Form.Control value={formData.anesthesiste} onChange={(e) => setFormData({ ...formData, anesthesiste: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Indication *</Form.Label>
              <Form.Control as="textarea" rows={2} value={formData.indication} onChange={(e) => setFormData({ ...formData, indication: e.target.value })} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Diagnostic préopératoire *</Form.Label>
              <Form.Control as="textarea" rows={2} value={formData.diagnosticPreOperatoire} onChange={(e) => setFormData({ ...formData, diagnosticPreOperatoire: e.target.value })} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Intervention *</Form.Label>
              <Form.Control as="textarea" rows={6} value={formData.intervention} onChange={(e) => setFormData({ ...formData, intervention: e.target.value })} required />
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
