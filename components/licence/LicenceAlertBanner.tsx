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

  const highestLevel = status.alerts.reduce((acc, alert) => {
    const priority = { info: 0, warning: 1, danger: 2 };
    return priority[alert.level] > priority[acc] ? alert.level : acc;
  }, "info" as "info" | "warning" | "danger");

  return (
    <Alert
      variant={highestLevel === "danger" ? "danger" : highestLevel === "warning" ? "warning" : "info"}
      className="m-0 rounded-0"
    >
      <div className="d-flex justify-content-between align-items-center container-fluid">
        <div>
          {status.alerts.map((alert) => (
            <div key={alert.code}>{alert.message}</div>
          ))}
        </div>
        <div>
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={() => router.push("/dashboard/licence")}
          >
            Gérer ma licence
          </button>
        </div>
      </div>
    </Alert>
  );
}
