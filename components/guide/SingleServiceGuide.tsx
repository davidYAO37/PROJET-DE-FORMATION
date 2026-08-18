"use client";

import { Container, Card, Alert } from "react-bootstrap";
import { getGuideService } from "@/lib/guideContent";
import ServiceGuidePoints from "./ServiceGuidePoints";

interface SingleServiceGuideProps {
  code: string;
}

export default function SingleServiceGuide({ code }: SingleServiceGuideProps) {
  const service = getGuideService(code);

  if (!service) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Guide indisponible pour ce service.</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-2">
      <Card className={`shadow-sm border-0 mb-4 bg-gradient bg-${service.color} text-white`}>
        <Card.Body className="d-flex align-items-center gap-3">
          <i className={`bi ${service.icon} fs-1`}></i>
          <div>
            <h2 className="mb-1 fw-bold">Guide d&apos;utilisation — {service.label}</h2>
            <p className="mb-0 opacity-75">{service.intro}</p>
          </div>
        </Card.Body>
      </Card>

      <ServiceGuidePoints service={service} />
    </Container>
  );
}
