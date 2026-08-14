"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Container,
  Form,
  InputGroup,
  Row,
  Col,
  Pagination,
  Toast,
  ToastContainer,
  Spinner,
  Modal,
  Badge,
  Card,
} from "react-bootstrap";
import {
  FaEdit,
  FaHistory,
  FaPlus,
  FaCheck,
  FaPause,
  FaTrash,
  FaEye,
} from "react-icons/fa";
import { Entreprise } from "@/types/entreprise";
import LicenceStatusBadge from "@/components/licence/LicenceStatusBadge";
import ModuleLabels from "@/components/licence/ModuleLabels";
import { LICENCE_MODULES, LicenceModuleCode } from "@/lib/licenceModules";

const ITEMS_PER_PAGE = 10;

interface LicenceOrderLight {
  _id: string;
  entrepriseId: string;
  action: string;
  status: string;
  amount: number;
  currency: string;
  durationMonths: number;
  createdAt: string;
}

interface LicenceHistoryEntry {
  _id: string;
  action: string;
  createdAt: string;
  notes?: string;
  price?: number;
  currency?: string;
}

export default function LicencesPage() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState<"success" | "info" | "danger">("info");

  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);

  // Modals
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const [trialDays, setTrialDays] = useState(14);
  const [purchaseMonths, setPurchaseMonths] = useState(12);
  const [purchasePrice, setPurchasePrice] = useState(100000);
  const [maintenanceMonths, setMaintenanceMonths] = useState(12);
  const [selectedModules, setSelectedModules] = useState<LicenceModuleCode[]>(
    LICENCE_MODULES.map((m) => m.code)
  );
  const [pendingOrders, setPendingOrders] = useState<LicenceOrderLight[]>([]);
  const [history, setHistory] = useState<LicenceHistoryEntry[]>([]);

  useEffect(() => {
    fetchEntreprises();
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch(
        "/api/licence/orders?status=pending,paid_awaiting_validation"
      );
      if (res.ok) {
        const data = await res.json();
        setPendingOrders(data);
      }
    } catch {
      // ignore
    }
  };

  const showNotification = (message: string, variant: "success" | "info" | "danger") => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchEntreprises = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/entreprise");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setEntreprises(data);
    } catch {
      setError("Impossible de charger les entreprises");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    url: string,
    body: object,
    successMessage: string,
    onSuccess?: () => void
  ) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotification(successMessage, "success");
        fetchEntreprises();
        onSuccess?.();
      } else {
        showNotification(data.error || "Erreur", "danger");
      }
    } catch {
      showNotification("Erreur réseau", "danger");
    }
  };

  const openTrialModal = (entreprise: Entreprise) => {
    setSelectedEntreprise(entreprise);
    setTrialDays(14);
    setSelectedModules(LICENCE_MODULES.map((m) => m.code));
    setShowTrialModal(true);
  };

  const openPurchaseModal = (entreprise: Entreprise, isRenewal = false) => {
    setSelectedEntreprise(entreprise);
    setPurchaseMonths(12);
    setPurchasePrice(100000);
    setSelectedModules(entreprise.modules || LICENCE_MODULES.map((m) => m.code));
    setShowPurchaseModal(true);
  };

  const openMaintenanceModal = (entreprise: Entreprise) => {
    setSelectedEntreprise(entreprise);
    setMaintenanceMonths(12);
    setShowMaintenanceModal(true);
  };

  const openHistoryModal = async (entreprise: Entreprise) => {
    setSelectedEntreprise(entreprise);
    setHistory([]);
    setShowHistoryModal(true);
    try {
      const res = await fetch(`/api/licence/history/${entreprise._id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      showNotification("Erreur chargement historique", "danger");
    }
  };

  const openOrdersModal = async () => {
    setShowOrdersModal(true);
    await fetchPendingOrders();
  };

  const validateOrder = async (orderId: string) => {
    await handleAction(
      `/api/licence/orders/${orderId}/validate`,
      {},
      "Commande validée et licence activée",
      () => {
        openOrdersModal();
        fetchEntreprises();
      }
    );
  };

  const toggleModule = (code: LicenceModuleCode) => {
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAllModules = () => {
    setSelectedModules(LICENCE_MODULES.map((m) => m.code));
  };

  const deselectAllModules = () => {
    setSelectedModules([]);
  };

  const ModuleSelector = () => (
    <Form.Group>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Form.Label className="mb-0 fw-semibold">Modules inclus</Form.Label>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={selectAllModules}>
            Tout cocher
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={deselectAllModules}>
            Tout décocher
          </Button>
        </div>
      </div>
      <div className="d-flex flex-wrap gap-3 p-3 border rounded bg-white">
        {LICENCE_MODULES.map((m) => (
          <Form.Check
            key={m.code}
            type="checkbox"
            id={`module-${m.code}`}
            label={m.label}
            checked={selectedModules.includes(m.code)}
            onChange={() => toggleModule(m.code)}
          />
        ))}
      </div>
      {selectedModules.length === 0 && (
        <Form.Text className="text-danger">Aucun module sélectionné.</Form.Text>
      )}
    </Form.Group>
  );

  const filtered = entreprises.filter((e) =>
    e.NomSociete?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div className="flex-grow-1 bg-light">
      <Container className="py-4">
        <Card className="shadow-sm border-0 mb-4 bg-gradient bg-primary text-white">
          <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h2 className="mb-1 fw-bold">
                <i className="bi bi-key-fill me-2"></i>Gestion des licences
              </h2>
              <p className="mb-0 opacity-75">
                Activez des essais, gérez les achats, les renouvellements et la maintenance.
              </p>
            </div>
            <Button
              variant="light"
              className="fw-semibold shadow-sm"
              onClick={openOrdersModal}
            >
              <FaCheck className="me-2 text-warning" />
              Commandes à valider
              {pendingOrders.length > 0 && (
                <Badge bg="danger" className="ms-2">
                  {pendingOrders.length}
                </Badge>
              )}
            </Button>
          </Card.Body>
        </Card>

        <Row className="mb-4 g-3">
          <Col md={6} lg={4}>
            <Card className="border-start border-4 border-info shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small text-uppercase fw-semibold">
                  Entreprises
                </div>
                <div className="fs-3 fw-bold text-primary">
                  {entreprises.length}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="border-start border-4 border-warning shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small text-uppercase fw-semibold">
                  En essai
                </div>
                <div className="fs-3 fw-bold text-warning">
                  {entreprises.filter((e) => e.licenceType === "trial").length}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="border-start border-4 border-success shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small text-uppercase fw-semibold">
                  Licences actives
                </div>
                <div className="fs-3 fw-bold text-success">
                  {
                    entreprises.filter(
                      (e) => e.licenceType === "paid" && e.licenceStatus === "active"
                    ).length
                  }
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6} lg={4}>
            <InputGroup className="shadow-sm">
              <InputGroup.Text className="bg-white">
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Rechercher une entreprise..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </InputGroup>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" /> Chargement...
          </div>
        ) : error ? (
          <div className="text-danger text-center">{error}</div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover className="text-center align-middle">
              <thead className="table-primary">
                <tr>
                  <th>#</th>
                  <th>Entreprise</th>
                  <th>Statut licence</th>
                  <th>Type</th>
                  <th>Expire le</th>
                  <th>Maintenance due</th>
                  <th>Modules</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                ) : (
                  paginated.map((entreprise, idx) => (
                    <tr key={entreprise._id}>
                      <td>{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                      <td>{entreprise.NomSociete}</td>
                      <td>
                        <LicenceStatusBadge entreprise={entreprise} />
                      </td>
                      <td>
                        {entreprise.licenceType === "trial"
                          ? "Essai"
                          : entreprise.licenceType === "paid"
                          ? "Payée"
                          : "—"}
                      </td>
                      <td>{formatDate(entreprise.licenceEndDate)}</td>
                      <td>{formatDate(entreprise.maintenanceDueDate)}</td>
                      <td>
                        <ModuleLabels modules={entreprise.modules} max={3} />
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="info"
                          className="me-1 mb-1"
                          onClick={() => openTrialModal(entreprise)}
                        >
                          <FaPlus /> Essai
                        </Button>
                        <Button
                          size="sm"
                          variant="success"
                          className="me-1 mb-1"
                          onClick={() => openPurchaseModal(entreprise)}
                        >
                          <FaEdit /> Licence
                        </Button>
                        <Button
                          size="sm"
                          variant="warning"
                          className="me-1 mb-1"
                          onClick={() => openPurchaseModal(entreprise, true)}
                        >
                          <FaEdit /> Renouv.
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          className="me-1 mb-1"
                          onClick={() => openMaintenanceModal(entreprise)}
                        >
                          <FaCheck /> Maint.
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="me-1 mb-1"
                          onClick={() => openHistoryModal(entreprise)}
                        >
                          <FaHistory />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="me-1 mb-1"
                          onClick={() =>
                            handleAction(
                              "/api/licence/suspend",
                              { entrepriseId: entreprise._id },
                              "Entreprise suspendue"
                            )
                          }
                        >
                          <FaPause />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="justify-content-center">
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item
                key={i}
                active={i + 1 === currentPage}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        )}

        {/* Modal Essai */}
        <Modal show={showTrialModal} onHide={() => setShowTrialModal(false)} centered size="lg">
          <Modal.Header closeButton className="bg-info text-white">
            <Modal.Title>
              <i className="bi bi-rocket-takeoff me-2"></i>
              Activer l&apos;essai — {selectedEntreprise?.NomSociete}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Durée de l&apos;essai (jours)</Form.Label>
                  <Form.Control
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    min={1}
                    className="shadow-sm"
                  />
                </Form.Group>
                <ModuleSelector />
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="outline-secondary" onClick={() => setShowTrialModal(false)}>
              Annuler
            </Button>
            <Button
              variant="info"
              className="text-white"
              disabled={selectedModules.length === 0}
              onClick={() => {
                if (selectedEntreprise) {
                  handleAction(
                    "/api/licence/activate-trial",
                    {
                      entrepriseId: selectedEntreprise._id,
                      durationDays: trialDays,
                      modules: selectedModules,
                    },
                    "Essai activé",
                    () => setShowTrialModal(false)
                  );
                }
              }}
            >
              Activer l&apos;essai
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Achat/Renouvellement */}
        <Modal
          show={showPurchaseModal}
          onHide={() => setShowPurchaseModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title>
              <i className="bi bi-credit-card me-2"></i>
              Licence / Renouvellement — {selectedEntreprise?.NomSociete}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Durée (mois)</Form.Label>
                      <Form.Control
                        type="number"
                        value={purchaseMonths}
                        onChange={(e) => setPurchaseMonths(Number(e.target.value))}
                        min={1}
                        className="shadow-sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Prix (XOF)</Form.Label>
                      <Form.Control
                        type="number"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(Number(e.target.value))}
                        min={0}
                        className="shadow-sm"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <ModuleSelector />
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="outline-secondary" onClick={() => setShowPurchaseModal(false)}>
              Annuler
            </Button>
            <Button
              variant="success"
              disabled={selectedModules.length === 0}
              onClick={() => {
                if (selectedEntreprise) {
                  handleAction(
                    "/api/licence/purchase",
                    {
                      entrepriseId: selectedEntreprise._id,
                      durationMonths: purchaseMonths,
                      price: purchasePrice,
                      currency: "XOF",
                      modules: selectedModules,
                    },
                    "Licence activée",
                    () => setShowPurchaseModal(false)
                  );
                }
              }}
            >
              Valider
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Maintenance */}
        <Modal
          show={showMaintenanceModal}
          onHide={() => setShowMaintenanceModal(false)}
          centered
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="bi bi-tools me-2"></i>
              Maintenance annuelle — {selectedEntreprise?.NomSociete}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Form.Group>
                  <Form.Label className="fw-semibold">Durée maintenance (mois)</Form.Label>
                  <Form.Control
                    type="number"
                    value={maintenanceMonths}
                    onChange={(e) => setMaintenanceMonths(Number(e.target.value))}
                    min={1}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="outline-secondary" onClick={() => setShowMaintenanceModal(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedEntreprise) {
                  handleAction(
                    "/api/licence/pay-maintenance",
                    {
                      entrepriseId: selectedEntreprise._id,
                      months: maintenanceMonths,
                    },
                    "Maintenance enregistrée",
                    () => setShowMaintenanceModal(false)
                  );
                }
              }}
            >
              Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Historique */}
        <Modal
          show={showHistoryModal}
          onHide={() => setShowHistoryModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Historique licence - {selectedEntreprise?.NomSociete}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Montant</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      Aucun historique.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h._id}>
                      <td>{new Date(h.createdAt).toLocaleString("fr-FR")}</td>
                      <td>{h.action}</td>
                      <td>
                        {h.price ? `${h.price} ${h.currency || ""}` : "—"}
                      </td>
                      <td>{h.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Modal.Body>
        </Modal>

        {/* Modal Commandes à valider */}
        <Modal
          show={showOrdersModal}
          onHide={() => setShowOrdersModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-warning">
            <Modal.Title>
              <i className="bi bi-basket me-2"></i>
              Commandes à traiter
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover size="sm" className="align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Date</th>
                  <th>Entreprise</th>
                  <th>Action</th>
                  <th>Montant</th>
                  <th>Durée</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      Aucune commande en attente.
                    </td>
                  </tr>
                ) : (
                  pendingOrders.map((o) => (
                    <tr key={o._id}>
                      <td>{new Date(o.createdAt).toLocaleString("fr-FR")}</td>
                      <td>
                        {entreprises.find((e) => e._id === o.entrepriseId)?.NomSociete ||
                          o.entrepriseId}
                      </td>
                      <td>{o.action}</td>
                      <td>
                        {o.amount} {o.currency}
                      </td>
                      <td>{o.durationMonths} mois</td>
                      <td>
                        <Badge
                          bg={
                            o.status === "paid_awaiting_validation"
                              ? "warning"
                              : o.status === "pending"
                              ? "info"
                              : "secondary"
                          }
                          text={o.status === "paid_awaiting_validation" ? "dark" : undefined}
                        >
                          {o.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => validateOrder(o._id)}
                        >
                          <FaCheck /> Valider
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Modal.Body>
        </Modal>

        <ToastContainer position="top-end" className="p-3">
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            bg={toastVariant}
            delay={3000}
            autohide
          >
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </div>
  );
}
