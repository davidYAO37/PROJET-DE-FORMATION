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
import { useAuthUser } from '@/hooks/useAuthUser';

interface LicenceStatus {
  effectiveStatus: string;
  isBlocked: boolean;
  daysUntilExpiration: number | null;
  daysUntilMaintenance: number | null;
  alerts: Array<{ code: string; level: string; message: string }>;
  licenceType: string | null;
  licenceEndDate: string | null;
  licensePurchasedAt: string | null;
  maintenanceAccepted: boolean;
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
  const [companyMaintenancePrice, setCompanyMaintenancePrice] = useState<number>(0);
  const [companyLicencePrice, setCompanyLicencePrice] = useState<number>(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<"purchase" | "maintenance">("purchase");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [amount, setAmount] = useState(100000);
  const { user, loading: userLoading } = useAuthUser();

  const isSuperAdmin = !!user && user.type === 'adminsuper';
  const alreadyPurchased = status?.licenceType === "paid";

  useEffect(() => {
    if (!user) return;
    if (user.type !== 'adminsuper' || alreadyPurchased) {
      setSelectedAction('maintenance');
    } else {
      setSelectedAction('purchase');
    }
  }, [user?.type, alreadyPurchased]);

  useEffect(() => {
    fetchStatus();
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!user || !user.entrepriseId) return;
    fetchOrders();
  }, [user]);

  useEffect(() => {
    // fetch entreprise data when user is available
    if (!user || !user.entrepriseId) return;
    const fetchEntreprise = async () => {
      try {
        const res = await fetch(`/api/entreprise/${user.entrepriseId}`);
        if (res.ok) {
          const data = await res.json();
          setCompanyMaintenancePrice(Number(data.maintenancePrice || 0));
          setCompanyLicencePrice(Number(data.licencePrice || 0));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchEntreprise();
  }, [user]);

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

  const fetchOrders = async () => {
    if (!user || !user.entrepriseId) return;
    try {
      const res = await fetch(`/api/licence/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCreateOrder = async () => {
    setOrdering(true);
    setMessage(null);
    try {
      // For non super-admins, create the order in manual mode so they cannot initiate payment directly.
      const paymentMethod = isSuperAdmin ? 'wave' : 'manual';

      const res = await fetch("/api/licence/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selectedAction,
          modules: selectedModules,
          amount,
          currency: "XOF",
          paymentMethod,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (isSuperAdmin && data.paymentUrl) {
          // Super-admins can be redirected to Wave to complete payment.
          window.location.href = data.paymentUrl;
          return;
        }
        // For regular admins, or when no paymentUrl is provided, just show a message.
        setMessage(
          "Commande créée. Elle sera validée par un super-admin avant paiement."
        );
        fetchOrders();
      } else {
        setMessage(data.error || "Erreur lors de la création de la commande");
      }
    } catch {
      setMessage("Erreur réseau");
    } finally {
      setOrdering(false);
    }
  };

  // Montants forfaitaires (pas de calcul par mois ni par module).
  const computedMaintenanceAmount = Math.round(companyMaintenancePrice || 0);
  const computedLicenceAmount = Math.round(companyLicencePrice || 0);

  useEffect(() => {
    if (!isSuperAdmin) {
      if (selectedAction === "maintenance") {
        setAmount(computedMaintenanceAmount);
      } else if (selectedAction === "purchase") {
        setAmount(computedLicenceAmount);
      }
    }
  }, [selectedAction, isSuperAdmin, computedMaintenanceAmount, computedLicenceAmount]);

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

  // open a pdf url in new window and try to trigger print
  const openAndPrint = (url: string) => {
    try {
      const w = window.open(url, "_blank");
      if (!w) return;
      // try to print when loaded
      const interval = setInterval(() => {
        try {
          if (w.document && (w.document.readyState === "complete" || w.document.body)) {
            clearInterval(interval as any);
            try {
              w.focus();
              w.print();
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // cross-origin might block access; can't auto-print then
          clearInterval(interval as any);
        }
      }, 500);
    } catch (e) {
      // ignore
    }
  };

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
                      ? "Licence perpétuelle (achetée)"
                      : "Non activée"}
                </ListGroup.Item>
                {status.licenceType === "trial" ? (
                  <ListGroup.Item>
                    <strong>Fin de l&apos;essai :</strong>{" "}
                    {status.licenceEndDate
                      ? new Date(status.licenceEndDate).toLocaleDateString("fr-FR")
                      : "—"}
                  </ListGroup.Item>
                ) : (
                  <ListGroup.Item>
                    <strong>Achetée le :</strong>{" "}
                    {status.licensePurchasedAt
                      ? new Date(status.licensePurchasedAt).toLocaleDateString("fr-FR")
                      : "—"}{" "}
                    <span className="text-muted small">(sans date d&apos;expiration)</span>
                  </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <strong>Maintenance :</strong>{" "}
                  {status.maintenanceAccepted ? (
                    <>
                      <Badge bg="success" className="me-2">Acceptée</Badge>
                      Échéance : {status.maintenanceDueDate
                        ? new Date(status.maintenanceDueDate).toLocaleDateString("fr-FR")
                        : "—"}
                    </>
                  ) : (
                    <Badge bg="secondary">Non souscrite</Badge>
                  )}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Prix maintenance :</strong> {companyMaintenancePrice.toLocaleString("fr-FR")} XOF / an
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Prix licence :</strong> {companyLicencePrice.toLocaleString("fr-FR")} XOF (forfait unique)
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
              Acheter / Maintenance
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="info">{message}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Action</Form.Label>
                <Form.Select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value as "purchase" | "maintenance")}
                >
                  {isSuperAdmin ? (
                    <>
                      <option value="purchase" disabled={alreadyPurchased}>
                        {alreadyPurchased ? "Licence déjà achetée" : "Acheter la licence (perpétuelle)"}
                      </option>
                      <option value="maintenance">Payer la maintenance annuelle</option>
                    </>
                  ) : (
                    <option value="maintenance">Payer la maintenance annuelle</option>
                  )}
                </Form.Select>
                {alreadyPurchased && (
                  <Form.Text className="text-muted d-block">
                    La licence est perpétuelle et a déjà été achetée : seule la maintenance annuelle peut être commandée.
                  </Form.Text>
                )}
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
                <Form.Label>Montant (XOF, forfaitaire)</Form.Label>
                <Form.Control
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  disabled={!isSuperAdmin}
                  min={0}
                />
                {!isSuperAdmin && (
                  <Form.Text className="text-muted d-block">
                    Montant calculé automatiquement : {(selectedAction === "maintenance" ? computedMaintenanceAmount : computedLicenceAmount).toLocaleString("fr-FR")} XOF
                  </Form.Text>
                )}
              </Form.Group>

              <Button
                variant="success"
                onClick={handleCreateOrder}
                disabled={
                  ordering ||
                  (selectedAction === "purchase" && (alreadyPurchased || selectedModules.length === 0))
                }
              >
                {ordering ? (
                  <Spinner animation="border" size="sm" />
                ) : isSuperAdmin ? (
                  "Procéder au paiement"
                ) : (
                  "Demander commande"
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

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>Historique des commandes</Card.Header>
            <Card.Body>
              {orders.length === 0 ? (
                <div>Aucune commande</div>
              ) : (
                <ListGroup>
                  {orders.map((o) => (
                    <ListGroup.Item key={o._id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div><strong>#{o._id}</strong> — {o.action} — {o.status}</div>
                        <div className="small text-muted">Montant: {o.amount?.toLocaleString?.("fr-FR") || o.amount} {o.currency}</div>
                      </div>
                      <div className="d-flex gap-2">
                        {o.orderFormUrl && (
                          <Button variant="outline-primary" size="sm" onClick={() => window.open(o.orderFormUrl, "_blank")}>
                            Voir bon de commande
                          </Button>
                        )}
                        {o.acquisitionContractUrl && (
                          <>
                            <Button variant="outline-secondary" size="sm" onClick={() => window.open(o.acquisitionContractUrl, "_blank")}>
                              Voir contrat
                            </Button>
                            <Button variant="outline-success" size="sm" onClick={() => openAndPrint(o.acquisitionContractUrl)}>
                              Imprimer
                            </Button>
                          </>
                        )}
                        {o.maintenanceContractUrl && (
                          <Button variant="outline-info" size="sm" onClick={() => window.open(o.maintenanceContractUrl, "_blank")}>
                            Contrat maintenance
                          </Button>
                        )}
                        {o.paymentReceiptUrl && (
                          <>
                            <Button variant="outline-warning" size="sm" onClick={() => window.open(o.paymentReceiptUrl, "_blank")}>
                              Voir reçu
                            </Button>
                            <Button variant="outline-dark" size="sm" onClick={() => openAndPrint(o.paymentReceiptUrl)}>
                              Imprimer reçu
                            </Button>
                          </>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
