"use client";

import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { useRouter } from "next/navigation";

interface LicenceStatusResponse {
  effectiveStatus: string;
  isBlocked: boolean;
  daysUntilExpiration: number | null;
  daysUntilMaintenance: number | null;
  alerts: Array<{ code: string; level: "info" | "warning" | "danger"; message: string }>;
  licenceType: string | null;
  licenceEndDate: string | null;
  maintenanceDueDate: string | null;
  modules: string[];
}

export default function LicenceAlertBanner() {
  const [status, setStatus] = useState<LicenceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/licence/status")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur");
        return res.json();
      })
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!status || !visible) return;
    if (!status.alerts || status.alerts.length <= 1) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % status.alerts.length);
    }, 4000);
    return () => clearInterval(id);
  }, [status, visible]);

  if (loading) {
    return (
      <div className="text-center p-2">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (!status) return null;

  if (status.isBlocked) {
    return (
      <Alert variant="danger" className="m-0 rounded-0 text-center">
        <strong>Licence bloquée</strong> — {" "}
        {status.alerts[0]?.message || "Contactez l'administrateur."}
      </Alert>
    );
  }

  if (status.alerts.length === 0) return null;

  // Show only actionable alerts (warnings/dangers). Do not display informational messages
  // such as activation notices (`TRIAL_ACTIVE`, `LICENCE_ACTIVE`). This ensures the banner
  // appears for suspension / approaching mise en demeure but not on activation.
  const actionableAlerts = status.alerts.filter((a) => a.level !== "info");
  if (actionableAlerts.length === 0) return null;

  const highestLevel = actionableAlerts.reduce((acc, alert) => {
    const priority = { info: 0, warning: 1, danger: 2 };
    return priority[alert.level] > priority[acc] ? alert.level : acc;
  }, "warning" as "info" | "warning" | "danger");

  if (!visible) return null; // closed for this page load (not persisted)

  const variant = highestLevel === "danger" ? "danger" : highestLevel === "warning" ? "warning" : "info";
  const currentAlert = actionableAlerts[index] || actionableAlerts[0];

  return (
    <Alert variant={variant} className="m-0 rounded-0">
      <div className="d-flex justify-content-between align-items-center container-fluid">
        <div style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
          <div
            style={{
              display: "inline-block",
              transition: "opacity 300ms",
            }}
            key={currentAlert.code}
          >
            {currentAlert.message}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={() => router.push("/dashboard/licence")}
          >
            Gérer ma licence
          </button>
          <button
            aria-label="Fermer bannière licence"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setVisible(false)}
          >
            ✕
          </button>
        </div>
      </div>
    </Alert>
  );
}
