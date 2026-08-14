"use client";

import { Accordion } from "react-bootstrap";
import { useLicenceModules } from "@/hooks/useLicenceModules";
import { LicenceModuleCode } from "@/lib/licenceModules";

interface ProtectedAccordionItemProps {
  module: LicenceModuleCode;
  eventKey: string;
  header: React.ReactNode;
  children: React.ReactNode;
}

export default function ProtectedAccordionItem({
  module,
  eventKey,
  header,
  children,
}: ProtectedAccordionItemProps) {
  const { hasModule, loading } = useLicenceModules();

  if (loading || !hasModule(module)) {
    return null;
  }

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header>{header}</Accordion.Header>
      <Accordion.Body className="ps-2">{children}</Accordion.Body>
    </Accordion.Item>
  );
}
