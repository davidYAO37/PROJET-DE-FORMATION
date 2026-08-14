"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Form,
  Badge,
  ListGroup,
} from "react-bootstrap";
import { LICENCE_MODULES, LicenceModuleCode } from "@/lib/licenceModules";

interface LicenceStatus {
  effectiveStatus: string;
  isBlocked: boolean;
  daysUntilExpiration: number | null;
  daysUntilMaintenance: number | null;
  alerts: Array<{ code: string; level: string; message: string }>;
  licenceType: string | null;
  licenceEndDate: string | null;
  maintenanceDueDate: string | null;
  modules: string[];
  userCount: number;
}

interface LicencePlan {
  _id: string;
  code: string;
  name: string;
  description?: string;
  durationMonths: number;
  defaultModules: string[];
  defaultPrice: number;
  currency: string;
}

export default function LicencePage() {
  const [status, setStatus] = useState<LicenceStatus | null>(null);
  const [plans, setPlans] = useState<LicencePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<"purchase" | "renewal" | "maintenance">("renewal");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [durationMonths, setDurationMonths] = useState(12);
  const [amount, setAmount] = useState(100000);

  useEffect(() => {
    fetchStatus();
    fetchPlans();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/licence/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setSelectedModules(data.modules || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/licence/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateOrder = async () => {
    setOrdering(true);
    setMessage(null);
    try {
      const res = await fetch("/api/licence/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selectedAction,
          durationMonths,
          modules: selectedModules,
          amount,
          currency: "XOF",
          paymentMethod: "wave",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          setMessage(
            "Demande enregistrée. L'administrateur validera votre paiement manuellement."
          );
        }
      } else {
        setMessage(data.error || "Erreur lors de la création de la commande");
      }
    } catch {
      setMessage("Erreur réseau");
    } finally {
      setOrdering(false);
    }
  };

  const toggleModule = (code: string) => {
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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!status) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Impossible de charger le statut de la licence.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-sm border-0 mb-4 bg-gradient bg-success text-white">
        <Card.Body className="d-flex align-items-center gap-3">
          <i className="bi bi-key-fill fs-1"></i>
          <div>
            <h2 className="mb-1 fw-bold">Ma licence</h2>
            <p className="mb-0 opacity-75">
              Gérez votre abonnement, vos modules et vos paiements.
            </p>
          </div>
        </Card.Body>
      </Card>

      {status.alerts.map((alert) => (
        <Alert
          key={alert.code}
          variant={
            alert.level === "danger" ? "danger" : alert.level === "warning" ? "warning" : "info"
          }
        >
          {alert.message}
        </Alert>
      ))}

      <Row className="g-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              Informations de la licence
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Type :</strong>{" "}
                  {status.licenceType === "trial"
                    ? "Essai"
                    : status.licenceType === "paid"
                    ? "Payée"
                    : status.licenceType === "maintenance_overdue"
                    ? "Maintenance en retard"
                    : "Non activée"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Expire le :</strong>{" "}
                  {status.licenceEndDate
                    ? new Date(status.licenceEndDate).toLocaleDateString("fr-FR")
                    : "—"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Maintenance due le :</strong>{" "}
                  {status.maintenanceDueDate
                    ? new Date(status.maintenanceDueDate).toLocaleDateString("fr-FR")
                    : "—"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Modules actifs :</strong>{" "}
                  {status.modules.length > 0 ? (
                    <div className="mt-2 d-flex flex-wrap gap-1">
                      {status.modules.map((code) => {
                        const label =
                          LICENCE_MODULES.find((m) => m.code === code)?.label || code;
                        return (
                          <Badge key={code} bg="light" text="dark" className="border">
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    "Aucun"
                  )}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Utilisateurs actifs :</strong> {status.userCount}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-success text-white">
              Renouveler / Acheter
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="info">{message}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Action</Form.Label>
                <Form.Select
                  value={selectedAction}
                  onChange={(e) =>
                    setSelectedAction(e.target.value as "purchase" | "renewal" | "maintenance")
                  }
                >
                  <option value="renewal">Renouveler la licence</option>
                  <option value="purchase">Acheter une licence</option>
                  <option value="maintenance">Payer la maintenance</option>
                </Form.Select>
              </Form.Group>

              {selectedAction !== "maintenance" && (
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0 fw-semibold">Modules à activer</Form.Label>
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
                        id={`client-module-${m.code}`}
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
              )}

              <Form.Group className="mb-3">
                <Form.Label>Durée (mois)</Form.Label>
                <Form.Control
                  type="number"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  min={1}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Montant (XOF)</Form.Label>
                <Form.Control
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={0}
                />
              </Form.Group>

              <Button
                variant="success"
                onClick={handleCreateOrder}
                disabled={ordering || selectedModules.length === 0}
              >
                {ordering ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Procéder au paiement"
                )}
              </Button>

              {plans.length > 0 && (
                <div className="mt-3">
                  <h6>Formules disponibles</h6>
                  <ListGroup variant="flush">
                    {plans.map((plan) => (
                      <ListGroup.Item key={plan._id}>
                        <strong>{plan.name}</strong> — {plan.durationMonths} mois —{" "}
                        {plan.defaultPrice} {plan.currency}
                        <div className="text-muted small">{plan.description}</div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
