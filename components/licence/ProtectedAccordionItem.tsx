"use client";

import { Accordion, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useLicenceModules } from "@/hooks/useLicenceModules";
import { LicenceModuleCode } from "@/lib/licenceModules";

interface ProtectedAccordionItemProps {
  module: LicenceModuleCode;
  eventKey: string;
  header: React.ReactNode;
  children: React.ReactNode;
}

const BLOCK_MESSAGES: Record<string, string> = {
  expired: "Essai expiré — accès bloqué. Contactez l'administrateur.",
  suspended: "Licence suspendue — accès bloqué.",
  resiliated: "Licence résiliée — accès bloqué.",
  maintenance_overdue: "Maintenance échue — accès bloqué. Réglez la maintenance pour continuer.",
};

export default function ProtectedAccordionItem({
  module,
  eventKey,
  header,
  children,
}: ProtectedAccordionItemProps) {
  const { hasModule, loading, isBlocked, effectiveStatus } = useLicenceModules();

  if (loading || !hasModule(module)) {
    return null;
  }

  if (isBlocked) {
    const message =
      (effectiveStatus && BLOCK_MESSAGES[effectiveStatus]) ||
      "Accès bloqué par votre licence. Contactez l'administrateur.";

    return (
      <OverlayTrigger
        placement="right"
        overlay={<Tooltip id={`licence-blocked-${eventKey}`}>{message}</Tooltip>}
      >
        <div className="opacity-50" aria-disabled="true">
          <div style={{ pointerEvents: "none", userSelect: "none" }}>
            <Accordion.Item eventKey={eventKey}>
              <Accordion.Header>
                {header} <i className="bi bi-lock-fill ms-2 text-muted"></i>
              </Accordion.Header>
              <Accordion.Body className="ps-2">{children}</Accordion.Body>
            </Accordion.Item>
          </div>
        </div>
      </OverlayTrigger>
    );
  }

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header>{header}</Accordion.Header>
      <Accordion.Body className="ps-2">{children}</Accordion.Body>
    </Accordion.Item>
  );
}
