"use client";

import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { LicenceModuleCode } from "@/lib/licenceModules";

interface LicenceStatusResponse {
  effectiveStatus: string;
  isBlocked: boolean;
  modules: string[];
}

interface LicenceModuleGuardProps {
  module: LicenceModuleCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function LicenceModuleGuard({
  module,
  children,
  fallback,
}: LicenceModuleGuardProps) {
  const [status, setStatus] = useState<LicenceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/licence/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!status || status.isBlocked) {
    return (
      fallback || (
        <Alert variant="danger" className="m-3">
          <strong>Accès refusé</strong> — Votre licence ne permet pas d&apos;accéder à ce
          module. Contactez l&apos;administrateur.
        </Alert>
      )
    );
  }

  const hasAccess =
    !status.modules || status.modules.length === 0 || status.modules.includes(module);

  if (!hasAccess) {
    return (
      fallback || (
        <Alert variant="warning" className="m-3">
          <strong>Module non inclus</strong> — Ce module ({module}) n&apos;est pas inclus dans
          votre licence actuelle.
        </Alert>
      )
    );
  }

  return <>{children}</>;
}
