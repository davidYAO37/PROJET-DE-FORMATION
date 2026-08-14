"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";

function WaveSimulatorContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const simulatePayment = async (success: boolean) => {
    if (!orderId) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/licence/simulate-wave-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, success }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data.error || "Erreur lors de la simulation");
        setLoading(false);
        return;
      }

      if (success && data.callbackUrl) {
        setPaid(true);
        setMessage("Paiement simulé avec succès. Redirection en cours...");
        setTimeout(() => {
          window.location.href = data.callbackUrl;
        }, 1500);
      } else if (!success) {
        setMessage("Paiement simulé échoué. Tu peux réessayer ou annuler.");
        setLoading(false);
      }
    } catch {
      setMessage("Erreur réseau");
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Identifiant de commande manquant.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow-lg border-0 mx-auto" style={{ maxWidth: 480 }}>
        <Card.Header className="bg-primary text-white text-center py-4">
          <i className="bi bi-phone-vibrate fs-1"></i>
          <h4 className="mt-2 mb-0">Simulateur Wave</h4>
          <small>Mode test — aucune vraie transaction</small>
        </Card.Header>
        <Card.Body className="p-4 text-center">
          <p className="text-muted">Commande</p>
          <h5 className="fw-bold">{orderId}</h5>
          <p className="fs-4 fw-bold text-primary my-3">
            {amount} {currency}
          </p>

          {message && (
            <Alert variant={paid ? "success" : "info"} className="my-3">
              {message}
            </Alert>
          )}

          {loading ? (
            <Spinner animation="border" />
          ) : (
            <div className="d-flex flex-column gap-3 mt-4">
              <Button
                variant="success"
                size="lg"
                onClick={() => simulatePayment(true)}
              >
                <i className="bi bi-check-circle me-2"></i>
                Simuler un paiement réussi
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={() => simulatePayment(false)}
              >
                <i className="bi bi-x-circle me-2"></i>
                Simuler un échec
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default function WaveSimulatorPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      }
    >
      <WaveSimulatorContent />
    </Suspense>
  );
}
